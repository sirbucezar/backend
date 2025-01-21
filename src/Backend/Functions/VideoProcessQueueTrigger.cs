using System;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Net.Http;
using Azure.Data.Tables;
using Azure.Storage.Blobs;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using backend.Models;
using System.Net.Http.Json;
using System.Collections.Generic;

namespace backend.Functions
{
    public class VideoProcessQueueTrigger
    {
        private readonly ILogger<VideoProcessQueueTrigger> _logger;
        private readonly HttpClient _httpClient;
        private readonly string _pythonServiceUrl;

        public VideoProcessQueueTrigger(ILoggerFactory loggerFactory, IHttpClientFactory httpClientFactory)
        {
            _logger = loggerFactory.CreateLogger<VideoProcessQueueTrigger>();
            _httpClient = httpClientFactory.CreateClient("PythonServiceClient");
            _pythonServiceUrl = Environment.GetEnvironmentVariable("PythonServiceUrl")
                ?? throw new InvalidOperationException("PythonServiceUrl not configured");
        }

        [Function("VideoProcessQueueTrigger")]
        public async Task ProcessVideoQueue(
            [QueueTrigger("videoprocess", Connection = "AzureWebJobsStorage")] string base64Message)
        {
            _logger.LogInformation("Received a message from the 'videoprocess' queue.");

            if (string.IsNullOrWhiteSpace(base64Message))
            {
                _logger.LogError("Received an empty message from the queue.");
                throw new ArgumentException("Queue message is empty.");
            }

            try
            {
                _logger.LogInformation($"Base64 message preview: {base64Message.Substring(0, Math.Min(100, base64Message.Length))}...");

                // Decode the Base64-encoded message
                byte[] messageBytes;
                string messageJson;
                try
                {
                    messageBytes = Convert.FromBase64String(base64Message);
                    messageJson = Encoding.UTF8.GetString(messageBytes);
                }
                catch (FormatException ex)
                {
                    _logger.LogError($"Failed to decode Base64 message: {ex.Message}");
                    throw new InvalidOperationException("Invalid Base64 encoding in the queue message.", ex);
                }

                _logger.LogInformation($"Decoded message JSON preview: {messageJson.Substring(0, Math.Min(200, messageJson.Length))}...");

                // Deserialize the JSON message
                var message = JsonSerializer.Deserialize<VideoProcessMessage>(messageJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (message == null || string.IsNullOrWhiteSpace(message.ProcessingId))
                {
                    _logger.LogError("Deserialized message is invalid or missing 'processingId'.");
                    throw new InvalidOperationException("Invalid message content or missing required fields.");
                }

                _logger.LogInformation($"Processing video request with ID: {message.ProcessingId}");

                await UpdateProcessingStatus(message.ProcessingId, "processing", "Video analysis started");

                var pythonRequest = new Dictionary<string, object> {
                    { "video_url", message.VideoUrl },
                    { "exercise", message.Exercise },
                    { "stages", message.Stages },
                    { "deployment_id", message.DeploymentId }
                };

                _logger.LogInformation("Sending video processing request to the Python API.");
                var response = await _httpClient.PostAsJsonAsync($"{_pythonServiceUrl}/analyze", pythonRequest);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Python API returned error: {response.StatusCode} - {errorContent}");
                    throw new Exception($"Python service returned {response.StatusCode}: {errorContent}");
                }

                var analysisResult = await response.Content.ReadFromJsonAsync<VideoAnalysisResult>();

                await StoreResults(message.ProcessingId, analysisResult);
                await UpdateProcessingStatus(message.ProcessingId, "completed", "Analysis completed successfully");

                _logger.LogInformation($"Video processing completed for {message.ProcessingId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing video queue message");

                try
                {
                    string processingId = ExtractProcessingId(base64Message);
                    await UpdateProcessingStatus(processingId, "failed", ex.Message);
                }
                catch (Exception statusEx)
                {
                    _logger.LogError(statusEx, "Failed to update error status in storage.");
                }

                throw; // Trigger retry policies
            }
        }

        private string ExtractProcessingId(string base64Message)
        {
            try
            {
                byte[] messageBytes = Convert.FromBase64String(base64Message);
                string messageJson = Encoding.UTF8.GetString(messageBytes);
                using var document = JsonDocument.Parse(messageJson);

                if (document.RootElement.TryGetProperty("ProcessingId", out var idElement))
                {
                    return idElement.GetString() ?? "unknown";
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting processingId from message.");
            }

            return "unknown";
        }

        private async Task UpdateProcessingStatus(string processingId, string status, string message)
        {
            var connectionString = Environment.GetEnvironmentVariable("AzureWebJobsStorage");
            var tableClient = new TableClient(connectionString, "VideoProcessing");
            await tableClient.CreateIfNotExistsAsync();

            var entity = new TableEntity(processingId, "status")
            {
                { "Status", status },
                { "Message", message },
                { "LastUpdated", DateTimeOffset.UtcNow }
            };

            await tableClient.UpsertEntityAsync(entity);
            _logger.LogInformation($"Updated processing status for {processingId} to '{status}'.");
        }

        private async Task StoreResults(string processingId, object results)
        {
            var connectionString = Environment.GetEnvironmentVariable("AzureWebJobsStorage");
            var blobClient = new BlobContainerClient(connectionString, "results");
            await blobClient.CreateIfNotExistsAsync();

            var blob = blobClient.GetBlobClient($"{processingId}.json");
            var content = JsonSerializer.Serialize(results);
            var bytes = Encoding.UTF8.GetBytes(content);
            using var stream = new System.IO.MemoryStream(bytes);
            await blob.UploadAsync(stream, overwrite: true);

            _logger.LogInformation($"Results stored in blob storage for {processingId}.");
        }
    }
}