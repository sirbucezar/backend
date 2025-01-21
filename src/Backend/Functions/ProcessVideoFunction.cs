using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Azure.Storage.Queues;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using backend.Models;
using backend.Helpers;
using Newtonsoft.Json;

namespace backend.Functions
{
    public class ProcessVideoFunction
    {
        private readonly ILogger<ProcessVideoFunction> _logger;

        public ProcessVideoFunction(ILoggerFactory loggerFactory)
        {
            _logger = loggerFactory.CreateLogger<ProcessVideoFunction>();
        }

        [Function("ProcessVideo")]
        public async Task<HttpResponseData> RunProcessVideo(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "process_video")] HttpRequestData req)
        {
            _logger.LogInformation("ProcessVideo function triggered.");

            try
            {
                // Read and validate request body
                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                if (string.IsNullOrWhiteSpace(requestBody))
                {
                    _logger.LogWarning("Received empty request body.");
                    return await ResponseHelpers.CreateJsonResponseAsync(req, HttpStatusCode.BadRequest, new { error = "Request body is required" });
                }

                // Deserialize the incoming request
                ProcessVideoRequest videoRequest;
                try
                {
                    videoRequest = System.Text.Json.JsonSerializer.Deserialize<ProcessVideoRequest>(requestBody, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (videoRequest == null)
                    {
                        throw new System.Text.Json.JsonException("Deserialized request is null.");
                    }
                }
                catch (System.Text.Json.JsonException jsonEx)
                {
                    _logger.LogError(jsonEx, "Invalid JSON format received.");
                    return await ResponseHelpers.CreateJsonResponseAsync(req, HttpStatusCode.BadRequest, new { error = "Invalid JSON format" });
                }

                // Validate the deserialized request
                if (string.IsNullOrWhiteSpace(videoRequest.VideoUrl) ||
                    string.IsNullOrWhiteSpace(videoRequest.Exercise) ||
                    videoRequest.Stages is null ||
                    !videoRequest.Stages.Any() ||
                    videoRequest.Stages.Any(s => string.IsNullOrWhiteSpace(s.Name) || s.EndTime <= s.StartTime))
                {
                    _logger.LogWarning("Invalid request data received.");
                    return await ResponseHelpers.CreateJsonResponseAsync(req, HttpStatusCode.BadRequest, new
                    {
                        error = "Invalid request. Ensure all required fields are provided and stage times are valid."
                    });
                }

                // Get storage connection string
                var storageConnString = Environment.GetEnvironmentVariable("AzureWebJobsStorage");
                if (string.IsNullOrWhiteSpace(storageConnString))
                {
                    _logger.LogError("AzureWebJobsStorage environment variable is not configured.");
                    throw new InvalidOperationException("Storage connection string not configured");
                }

                // Create the queue client and ensure it exists
                var queueClient = new QueueClient(storageConnString, "videoprocess");
                await queueClient.CreateIfNotExistsAsync();

                // Generate processing ID early and construct full message object
                string processingId = Guid.NewGuid().ToString();
                var queueMessage = new
                {
                    ProcessingId = processingId, // Assign ID before encoding
                    videoRequest.Exercise,
                    videoRequest.VideoUrl,
                    videoRequest.Stages,
                    videoRequest.UserId,
                    videoRequest.DeploymentId,
                    Timestamp = DateTimeOffset.UtcNow
                };

                // Convert the message to a Base64 encoded string (only one encoding)
                string messageJson = JsonConvert.SerializeObject(queueMessage);
                string finalBase64Message = Convert.ToBase64String(Encoding.UTF8.GetBytes(messageJson));

                _logger.LogInformation($"Message JSON before encoding: {messageJson}");
                _logger.LogInformation($"Base64 Encoded Message: {finalBase64Message}");

                // Send the message to the Azure Storage Queue
                await queueClient.SendMessageAsync(finalBase64Message);

                // Create the HTTP response
                var response = req.CreateResponse(HttpStatusCode.Accepted);
                response.Headers.Add("Location", $"/api/video_status/{processingId}");
                response.Headers.Add("Retry-After", "60");
                await response.WriteAsJsonAsync(new
                {
                    processing_id = processingId,
                    status = "accepted",
                    status_url = $"/api/video_status/{processingId}",
                    estimated_completion_time = DateTimeOffset.UtcNow.AddMinutes(5)
                });

                _logger.LogInformation($"Video processing request queued successfully. Processing ID: {processingId}");
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing video request");
                return await ResponseHelpers.CreateJsonResponseAsync(req, HttpStatusCode.InternalServerError, new { error = "Internal server error" });
            }
        }
    }
}