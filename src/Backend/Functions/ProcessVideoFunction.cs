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
                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                if (string.IsNullOrWhiteSpace(requestBody))
                {
                    return await ResponseHelpers.CreateJsonResponseAsync(req, HttpStatusCode.BadRequest, new { error = "Request body is required" });
                }

                var videoRequest = JsonSerializer.Deserialize<ProcessVideoRequest>(requestBody);
                if (videoRequest == null ||
                    string.IsNullOrWhiteSpace(videoRequest.VideoUrl) ||
                    string.IsNullOrWhiteSpace(videoRequest.Exercise) ||
                    videoRequest.Stages is null ||
                    !videoRequest.Stages.Any() ||
                    videoRequest.Stages.Any(s => string.IsNullOrWhiteSpace(s.Name) || s.EndTime <= s.StartTime))
                {
                    return await ResponseHelpers.CreateJsonResponseAsync(req, HttpStatusCode.BadRequest, new { 
                        error = "Invalid request. Ensure all required fields are provided and stage times are valid." 
                    });
                }

                var storageConnString = Environment.GetEnvironmentVariable("AzureWebJobsStorage");
                if (string.IsNullOrWhiteSpace(storageConnString))
                {
                    throw new InvalidOperationException("Storage connection string not configured");
                }

                var queueClient = new QueueClient(storageConnString, "videoprocess");
                await queueClient.CreateIfNotExistsAsync();

                var processingId = Guid.NewGuid().ToString();
                var queueMessage = new
                {
                    processingId,
                    videoRequest.Exercise,
                    videoRequest.VideoUrl,
                    videoRequest.Stages,
                    videoRequest.UserId,
                    videoRequest.DeploymentId,
                    Timestamp = DateTimeOffset.UtcNow
                };

                var messageJson = JsonSerializer.Serialize(queueMessage);
                var messageBytes = Encoding.UTF8.GetBytes(messageJson);
                var base64Message = Convert.ToBase64String(messageBytes);

                await queueClient.SendMessageAsync(base64Message);

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

                _logger.LogInformation($"Video processing request queued. Processing ID: {processingId}");
                return response;
            }
            catch (JsonException jsonEx)
            {
                _logger.LogError(jsonEx, "Error parsing request JSON");
                return await ResponseHelpers.CreateJsonResponseAsync(req, HttpStatusCode.BadRequest, new { error = "Invalid JSON format" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing video request");
                return await ResponseHelpers.CreateJsonResponseAsync(req, HttpStatusCode.InternalServerError, new { error = "Internal server error" });
            }
        }
    }
}