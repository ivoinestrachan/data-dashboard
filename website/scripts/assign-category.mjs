import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function assignCategory() {
  // Find the "picking up cups" video
  const response = await fetch(`${SUPABASE_URL}/rest/v1/videos?title=eq.picking%20up%20cups&select=*`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    }
  })

  if (!response.ok) {
    console.error('Error fetching video:', await response.text())
    process.exit(1)
  }

  const videos = await response.json()

  if (videos.length === 0) {
    console.log('❌ Video "picking up cups" not found')
    process.exit(1)
  }

  const video = videos[0]
  console.log(`Found video: "${video.title}"`)

  // Update metadata to include category
  const updatedMetadata = {
    ...(video.metadata || {}),
    category: 'Pick & Place'
  }

  const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/videos?id=eq.${video.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      metadata: updatedMetadata
    })
  })

  if (updateResponse.ok) {
    console.log('✅ Successfully assigned "Pick & Place" category to "picking up cups"')
  } else {
    console.log('❌ Failed to update:', await updateResponse.text())
    process.exit(1)
  }
}

assignCategory()
