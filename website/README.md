# Arm

A Next.js application for robot training data management with social authentication.

## Features

- **Facebook OAuth** authentication for Meta integration
- **Meta Ray-Ban Integration** via Instagram Graph API
- **REST API** for video fetching and synchronization
- **Webhook support** for real-time video updates
- Dashboard with sidebar navigation
- Video gallery view
- Black and white minimalist theme
- TypeScript & Tailwind CSS
- NextAuth.js v5 for authentication

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

### 3. Set up Facebook OAuth & Instagram Integration

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select existing
3. Add **Facebook Login** product
4. Add **Instagram Graph API** product (for Meta Ray-Ban video access)
5. In Settings → Basic, copy App ID and App Secret
6. Add Valid OAuth Redirect URI: `http://localhost:3000/api/auth/callback/facebook`
7. Ensure you have:
   - A Facebook Page
   - An Instagram Business Account linked to that page
8. Add credentials to `.env.local`
9. (Optional) Configure webhooks for real-time updates (see API.md)

### 4. Generate AUTH_SECRET

```bash
openssl rand -base64 32
```

Add the output to `.env.local` as `AUTH_SECRET`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth API route
│   │   ├── videos/              # Video API endpoints
│   │   │   ├── route.ts        # GET all videos
│   │   │   └── [id]/route.ts   # GET video by ID
│   │   ├── sync/               # Manual sync endpoint
│   │   │   └── route.ts        # POST sync videos
│   │   └── webhook/            # Meta webhook endpoint
│   │       └── route.ts        # GET/POST webhook handler
│   ├── dashboard/              # Dashboard pages
│   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   └── page.tsx            # Main dashboard page
│   ├── login/                  # Login page
│   └── page.tsx                # Home page (redirects)
├── components/
│   ├── Sidebar.tsx             # Sidebar navigation
│   ├── Providers.tsx           # SessionProvider wrapper
│   └── VideoCard.tsx           # Video card component for gallery
├── lib/
│   └── meta-api.ts             # Meta Graph API client library
├── types/
│   └── next-auth.d.ts          # NextAuth type extensions
├── auth.ts                     # NextAuth configuration
└── API.md                      # API documentation
```

## API Endpoints

See [API.md](./API.md) for detailed API documentation.

- `GET /api/videos` - Fetch all videos from Instagram
- `GET /api/videos/[id]` - Fetch a specific video by ID
- `POST /api/sync` - Manually trigger video synchronization
- `GET/POST /api/webhook` - Webhook for real-time Meta updates

## Next Steps

- Add database (PostgreSQL/MongoDB) for video storage
- Implement video caching and CDN integration
- Add real-time dashboard updates via WebSockets
- Build video playback functionality
- Add video download/export features
- Implement user settings page
- Add analytics and video metadata tracking

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- NextAuth.js v5
- React Icons
