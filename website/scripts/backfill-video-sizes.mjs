import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function backfillVideoSizes() {
  console.log('Fetching videos without size...')

  // Get all videos
  const response = await fetch(`${SUPABASE_URL}/rest/v1/videos?select=*`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    }
  })

  if (!response.ok) {
    console.error('Error fetching videos:', await response.text())
    process.exit(1)
  }

  const videos = await response.json()
  console.log(`Found ${videos.length} videos`)

  let updated = 0
  let skipped = 0

  for (const video of videos) {
    if (video.size && video.size > 0) {
      console.log(`✓ Skipping "${video.title}" - already has size: ${video.size} bytes`)
      skipped++
      continue
    }

    if (!video.storage_path) {
      console.log(`⚠ Skipping "${video.title}" - no storage path`)
      skipped++
      continue
    }

    try {
      // Get file size from storage
      const storageUrl = `${SUPABASE_URL}/storage/v1/object/videos/${video.storage_path}`
      const headResponse = await fetch(storageUrl, {
        method: 'HEAD',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        }
      })

      if (!headResponse.ok) {
        console.log(`⚠ Could not get size for "${video.title}" - file not found`)
        continue
      }

      const contentLength = headResponse.headers.get('content-length')
      if (!contentLength) {
        console.log(`⚠ Could not get size for "${video.title}" - no content-length header`)
        continue
      }

      const size = parseInt(contentLength, 10)

      // Update video size in database
      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/videos?id=eq.${video.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ size })
      })

      if (updateResponse.ok) {
        const sizeKB = (size / 1024).toFixed(2)
        const sizeMB = (size / (1024 * 1024)).toFixed(2)
        console.log(`✅ Updated "${video.title}": ${size} bytes (${sizeKB} KB / ${sizeMB} MB)`)
        updated++
      } else {
        console.log(`❌ Failed to update "${video.title}":`, await updateResponse.text())
      }
    } catch (error) {
      console.error(`❌ Error processing "${video.title}":`, error.message)
    }
  }

  console.log(`\n✅ Backfill complete!`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped}`)
}

backfillVideoSizes()
