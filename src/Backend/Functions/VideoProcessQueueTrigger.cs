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
            try
            {
                var messageBytes = Convert.FromBase64String(base64Message);
                var messageJson = Encoding.UTF8.GetString(messageBytes);
                var message = JsonSerializer.Deserialize<VideoProcessMessage>(messageJson);

                _logger.LogInformation($"Processing video request {message.ProcessingId}");

                await UpdateProcessingStatus(message.ProcessingId, "processing", "Video analysis started");

                var pythonRequest = new
                {
                    message.VideoUrl,
                    message.Exercise,
                    message.Stages,
                    message.DeploymentId
                };

                var response = await _httpClient.PostAsJsonAsync($"{_pythonServiceUrl}/analyze", pythonRequest);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
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
                    string processingId = "unknown";
                    if (!string.IsNullOrEmpty(base64Message))
                    {
                        var messageBytes = Convert.FromBase64String(base64Message);
                        var messageJson = Encoding.UTF8.GetString(messageBytes);
                        using var document = JsonDocument.Parse(messageJson);
                        if (document.RootElement.TryGetProperty("processingId", out var idElement))
                        {
                            processingId = idElement.GetString();
                        }
                    }
                    await UpdateProcessingStatus(processingId, "failed", ex.Message);
                }
                catch (Exception statusEx)
                {
                    _logger.LogError(statusEx, "Failed to update error status");
                }

                throw; // trigger retry policies
            }
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
        }
    }
}