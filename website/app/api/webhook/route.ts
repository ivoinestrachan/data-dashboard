import { NextRequest, NextResponse } from "next/server"

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "meta_rayban_webhook_token"

/**
 * GET handler for webhook verification
 * Meta/Facebook will send a GET request to verify the webhook endpoint
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      console.log("Webhook verified successfully")
      return new NextResponse(challenge, { status: 200 })
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      return NextResponse.json(
        { error: "Verification token mismatch" },
        { status: 403 }
      )
    }
  }

  return NextResponse.json(
    { error: "Missing verification parameters" },
    { status: 400 }
  )
}

/**
 * POST handler for webhook events
 * Meta/Facebook will send POST requests when subscribed events occur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("Webhook event received:", JSON.stringify(body, null, 2))

    // Process the webhook payload
    if (body.object === "instagram") {
      // Handle Instagram-related events
      const entries = body.entry || []

      for (const entry of entries) {
        const changes = entry.changes || []

        for (const change of changes) {
          const { field, value } = change

          console.log(`Change detected - Field: ${field}`)

          // Handle media updates (new videos from Ray-Bans)
          if (field === "media") {
            const mediaId = value.media_id || value.id
            console.log(`New media posted: ${mediaId}`)

            // Here you would typically:
            // 1. Fetch the media details using the Graph API
            // 2. Store it in your database
            // 3. Notify the user
            // 4. Update the dashboard in real-time
          }

          // Handle mentions
          if (field === "mentions") {
            console.log("Mention detected:", value)
          }

          // Handle comments
          if (field === "comments") {
            console.log("Comment detected:", value)
          }
        }
      }
    }

    // Return 200 OK to acknowledge receipt of the event
    return NextResponse.json({ success: true, received: true })
  } catch (error: any) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
