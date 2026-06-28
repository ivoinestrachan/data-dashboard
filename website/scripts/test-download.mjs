import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function testDownload() {
  console.log('Testing download endpoint...\n')

  // Get the published model
  const modelResponse = await fetch(`${SUPABASE_URL}/rest/v1/published_models?select=*&limit=1`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    }
  })

  const models = await modelResponse.json()
  if (models.length === 0) {
    console.log('❌ No published models found')
    return
  }

  const model = models[0]
  console.log('📦 Model:', model.name)
  console.log('   Category:', model.category)
  console.log('')

  // Test the query that download endpoint uses
  const category = model.category || model.specialty.split(' ')[0]
  console.log('🔍 Searching for videos with category:', category)
  console.log('   Query: metadata->>category = "' + category + '"')
  console.log('')

  const videoResponse = await fetch(`${SUPABASE_URL}/rest/v1/videos?select=*&metadata->>category=eq.${encodeURIComponent(category)}`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    }
  })

  if (!videoResponse.ok) {
    console.log('❌ Query failed:', await videoResponse.text())
    return
  }

  const videos = await videoResponse.json()
  console.log(`📹 Found ${videos.length} videos:`)
  console.log('')

  videos.forEach(video => {
    const sizeKB = (video.size / 1024).toFixed(2)
    const sizeMB = (video.size / (1024 * 1024)).toFixed(2)
    console.log(`   "${video.title}"`)
    console.log(`   - Size: ${video.size} bytes (${sizeKB} KB / ${sizeMB} MB)`)
    console.log(`   - Category: ${video.metadata?.category || 'No category'}`)
    console.log('')
  })

  const totalBytes = videos.reduce((sum, v) => sum + (v.size || 0), 0)
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2)
  console.log(`📊 Total: ${videos.length} videos, ${totalMB} MB`)
}

testDownload()
