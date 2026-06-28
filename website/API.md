# API Documentation

## Overview

This API integrates with Meta's Graph API to fetch and sync videos from Meta Ray-Ban glasses via Instagram.

## Authentication

All API endpoints require Facebook OAuth authentication via NextAuth.js. The user must be signed in with their Facebook account that has an Instagram Business Account linked.

## Endpoints

### 1. Get Videos

Fetch videos from the user's Instagram account (where Meta Ray-Ban videos are synced).

**Endpoint:** `GET /api/videos`

**Query Parameters:**
- `limit` (optional): Number of videos to fetch (default: 25, max: 100)

**Response:**
```json
{
  "success": true,
  "videos": [
    {
      "id": "123456789",
      "caption": "My video caption",
      "media_type": "VIDEO",
      "media_url": "https://...",
      "thumbnail_url": "https://...",
      "timestamp": "2024-01-01T12:00:00+0000",
      "permalink": "https://instagram.com/p/..."
    }
  ],
  "count": 10,
  "paging": {
    "cursors": {
      "before": "...",
      "after": "..."
    },
    "next": "https://graph.facebook.com/..."
  }
}
```

### 2. Get Single Video

Fetch a specific video by ID.

**Endpoint:** `GET /api/videos/[id]`

**Response:**
```json
{
  "success": true,
  "video": {
    "id": "123456789",
    "caption": "My video caption",
    "media_type": "VIDEO",
    "media_url": "https://...",
    "thumbnail_url": "https://...",
    "timestamp": "2024-01-01T12:00:00+0000",
    "permalink": "https://instagram.com/p/..."
  }
}
```

### 3. Sync Videos

Manually trigger a sync of videos from Instagram.

**Endpoint:** `POST /api/sync`

**Response:**
```json
{
  "success": true,
  "message": "Sync completed successfully",
  "videosFound": 25,
  "lastSync": "2024-01-01T12:00:00.000Z",
  "videos": [...]
}
```

### 4. Webhook

Endpoint for Meta/Facebook to send real-time updates about new videos.

**Endpoint (Verification):** `GET /api/webhook`

**Query Parameters:**
- `hub.mode`: Should be "subscribe"
- `hub.verify_token`: Your webhook verification token
- `hub.challenge`: Challenge string to echo back

**Endpoint (Events):** `POST /api/webhook`

**Payload Example:**
```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "instagram-account-id",
      "time": 1234567890,
      "changes": [
        {
          "field": "media",
          "value": {
            "media_id": "123456789"
          }
        }
      ]
    }
  ]
}
```

## Setup Instructions

### 1. Facebook App Configuration

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select existing
3. Add **Facebook Login** product
4. Add **Instagram Basic Display** or **Instagram Graph API** product
5. Configure OAuth Redirect URIs:
   - `http://localhost:3000/api/auth/callback/facebook`
   - `https://yourdomain.com/api/auth/callback/facebook` (production)

### 2. Instagram Business Account

1. Ensure your Facebook account has a Facebook Page
2. Link an Instagram Business Account to that Facebook Page
3. Grant necessary permissions when logging in:
   - `public_profile`
   - `email`
   - `instagram_basic`
   - `instagram_content_publish`

### 3. Webhook Configuration

1. In your Facebook App dashboard, go to **Webhooks**
2. Click **Add Subscription** for Instagram
3. Enter your webhook URL: `https://yourdomain.com/api/webhook`
4. Enter your verify token (same as in `.env`)
5. Subscribe to fields:
   - `media` (for new video uploads)
   - `mentions`
   - `comments`

### 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
AUTH_SECRET=<generated-with-openssl-rand-base64-32>
NEXTAUTH_URL=http://localhost:3000
FACEBOOK_CLIENT_ID=<your-facebook-app-id>
FACEBOOK_CLIENT_SECRET=<your-facebook-app-secret>
META_GRAPH_API_VERSION=v21.0
WEBHOOK_VERIFY_TOKEN=<your-secure-random-token>
```

## Meta Ray-Ban Integration

Meta Ray-Ban glasses automatically sync videos to the connected Instagram account. This API:

1. Authenticates users via Facebook OAuth
2. Accesses their Instagram Business Account
3. Fetches videos uploaded from Meta Ray-Ban glasses
4. Listens for webhook events when new videos are uploaded
5. Provides real-time sync capabilities

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `401 Unauthorized`: User not authenticated or missing access token
- `403 Forbidden`: Insufficient permissions or invalid verification token
- `500 Internal Server Error`: API request failed

## Rate Limiting

Meta Graph API has rate limits. Consider implementing:
- Caching for frequently accessed data
- Batch requests where possible
- Error handling for rate limit responses

## Next Steps

- Implement database storage for videos
- Add real-time updates using WebSockets or Server-Sent Events
- Implement video download/backup functionality
- Add video analytics and metadata tracking
