# Mobile App Integration Guide

## Overview

This guide explains how to integrate your mobile app with the Meta Ray-Ban dashboard API using the Meta Wearables Device Access Toolkit.

## Architecture

```
Meta Ray-Ban Glasses → Mobile App (SDK) → Dashboard API → Web Dashboard
```

## Prerequisites

1. **Meta Wearables Device Access Toolkit**
   - iOS: https://github.com/facebook/meta-wearables-dat-ios
   - Android: https://github.com/facebook/meta-wearables-dat-android

2. **Meta AI App** installed and configured
3. **Ray-Ban Meta glasses** paired with mobile device
4. **Developer Mode** enabled in Meta AI app

## API Endpoint

### Upload Video

**Endpoint:** `POST /api/upload`

**Authentication:** Required (use session cookie or API key)

**Content-Type:** `multipart/form-data`

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `video` | File | Yes | Video file from glasses |
| `title` | String | No | Video title (default: "Untitled Video") |
| `description` | String | No | Video description |
| `recordedAt` | ISO 8601 String | No | When video was recorded |
| `metadata` | JSON String | No | Additional metadata (see below) |

**Metadata Structure:**

```json
{
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "deviceModel": "Ray-Ban Meta Gen 2",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

**Example Request (JavaScript/TypeScript):**

```typescript
const uploadVideo = async (videoBlob: Blob, title: string) => {
  const formData = new FormData()
  formData.append('video', videoBlob, 'recording.mp4')
  formData.append('title', title)
  formData.append('recordedAt', new Date().toISOString())
  formData.append('metadata', JSON.stringify({
    width: 1920,
    height: 1080,
    fps: 30,
    deviceModel: 'Ray-Ban Meta Gen 2'
  }))

  const response = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include' // Include auth cookies
  })

  const data = await response.json()
  return data
}
```

**Example Request (Swift/iOS):**

```swift
func uploadVideo(videoURL: URL, title: String) async throws {
    var request = URLRequest(url: URL(string: "http://localhost:3000/api/upload")!)
    request.httpMethod = "POST"

    let boundary = UUID().uuidString
    request.setValue("multipart/form-data; boundary=\(boundary)",
                     forHTTPHeaderField: "Content-Type")

    var body = Data()

    // Add video file
    body.append("--\(boundary)\r\n")
    body.append("Content-Disposition: form-data; name=\"video\"; filename=\"recording.mp4\"\r\n")
    body.append("Content-Type: video/mp4\r\n\r\n")
    body.append(try Data(contentsOf: videoURL))
    body.append("\r\n")

    // Add title
    body.append("--\(boundary)\r\n")
    body.append("Content-Disposition: form-data; name=\"title\"\r\n\r\n")
    body.append(title)
    body.append("\r\n")

    // End boundary
    body.append("--\(boundary)--\r\n")

    request.httpBody = body

    let (data, response) = try await URLSession.shared.data(for: request)
    // Handle response
}
```

**Example Request (Kotlin/Android):**

```kotlin
suspend fun uploadVideo(videoFile: File, title: String): Result<VideoResponse> {
    val requestBody = MultipartBody.Builder()
        .setType(MultipartBody.FORM)
        .addFormDataPart(
            "video",
            "recording.mp4",
            videoFile.asRequestBody("video/mp4".toMediaType())
        )
        .addFormDataPart("title", title)
        .addFormDataPart("recordedAt", Instant.now().toString())
        .build()

    val request = Request.Builder()
        .url("http://localhost:3000/api/upload")
        .post(requestBody)
        .build()

    return withContext(Dispatchers.IO) {
        val response = client.newCall(request).execute()
        // Handle response
    }
}
```

**Success Response (200):**

```json
{
  "success": true,
  "video": {
    "id": "uuid-here",
    "title": "My Video",
    "filename": "uuid.mp4",
    "videoUrl": "/uploads/videos/uuid.mp4",
    "thumbnailUrl": null,
    "size": 15728640,
    "mimeType": "video/mp4",
    "recordedAt": "2024-06-27T10:00:00Z",
    "uploadedAt": "2024-06-27T10:05:00Z",
    "metadata": {
      "width": 1920,
      "height": 1080,
      "fps": 30
    }
  }
}
```

**Error Response (400/401/500):**

```json
{
  "error": "Error message here"
}
```

## Meta Wearables SDK Integration

### 1. Setup (iOS)

```swift
import MetaWearablesDAT

// Initialize SDK
let wearables = MetaWearables()

// Request permissions
await wearables.requestPermissions()

// Check if glasses are connected
if await wearables.isDeviceConnected() {
    // Start camera session
    let session = await wearables.startCameraSession()

    // Capture video
    let videoURL = await session.captureVideo()

    // Upload to API
    try await uploadVideo(videoURL: videoURL, title: "Recording")
}
```

### 2. Setup (Android)

```kotlin
import com.meta.wearables.dat.*

// Initialize SDK
val wearables = MetaWearables(context)

// Request permissions
wearables.requestPermissions()

// Check if glasses are connected
if (wearables.isDeviceConnected()) {
    // Start camera session
    val session = wearables.startCameraSession()

    // Capture video
    val videoFile = session.captureVideo()

    // Upload to API
    uploadVideo(videoFile, "Recording")
}
```

## Authentication

For now, the API uses session-based authentication. The mobile app should:

1. Authenticate via web login flow
2. Store session cookie
3. Include cookie in upload requests

**Future:** Will add API key authentication for mobile apps.

## Testing

### 1. Test Upload with cURL

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "video=@test-video.mp4" \
  -F "title=Test Video" \
  -F "recordedAt=2024-06-27T10:00:00Z"
```

### 2. Verify in Dashboard

After uploading, check the dashboard at `http://localhost:3000/dashboard` to see the video appear in the gallery.

## Next Steps

1. **Mobile App Development**
   - Build React Native app OR native iOS/Android app
   - Integrate Meta Wearables SDK
   - Implement video upload functionality

2. **Production Deployment**
   - Replace in-memory storage with PostgreSQL/MongoDB
   - Set up cloud storage (AWS S3, Cloudflare R2)
   - Add API key authentication
   - Implement video thumbnail generation
   - Add video transcoding for different qualities

3. **Features to Add**
   - Real-time sync status
   - Background uploads
   - Offline queue
   - Video editing/trimming
   - Share functionality

## Resources

- Meta Wearables Toolkit Docs: https://wearables.developer.meta.com
- GitHub (iOS): https://github.com/facebook/meta-wearables-dat-ios
- GitHub (Android): https://github.com/facebook/meta-wearables-dat-android
- API Documentation: See `API.md` in project root
