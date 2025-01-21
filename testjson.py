import base64
import json

message = {
    "processingId": "5ab88f16-ba4f-4309-a151-0c30a51f4e2a",
    "Exercise": "shotput",
    "VideoUrl": "https://athleticstorage.blob.core.windows.net/uploads/test_poison?sp=r&st=2025-01-20T15:40:21Z&se=2025-01-20T23:40:21Z&sv=2022-11-02&sr=b&sig=86dmcWwS0UuET%2BcfknuZ%2FXV7zw8WyQzPQsqsYi%2Bc1FQ%3D",
    "Stages": [
        {"name": "stage1", "start_time": 51, "end_time": 83},
        {"name": "stage2", "start_time": 80, "end_time": 93},
        {"name": "stage3", "start_time": 93, "end_time": 104},
        {"name": "stage4", "start_time": 104, "end_time": 106},
        {"name": "stage5", "start_time": 106, "end_time": 120}
    ],
    "UserId": "userebobo",
    "DeploymentId": "deployment_test",
    "Timestamp": "2025-01-20T16:30:02.8297725+00:00"
}

# Encode the message as Base64
encoded_message = base64.b64encode(json.dumps(message).encode()).decode()

print("Base64 Encoded Message:")
print(encoded_message)

# Decode to verify correctness
decoded_message = json.loads(base64.b64decode(encoded_message).decode())
print("\nDecoded Message:")
print(json.dumps(decoded_message, indent=4))