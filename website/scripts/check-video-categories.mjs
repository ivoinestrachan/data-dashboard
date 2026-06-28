import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function checkVideoCategories() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/videos?select=id,title,metadata`, {
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

  console.log('\n📹 Video Categories:\n')
  videos.forEach(video => {
    const category = video.metadata?.category || 'No category'
    console.log(`   "${video.title}": ${category}`)
  })

  console.log('\n')
}

checkVideoCategories()
