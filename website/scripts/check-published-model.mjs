import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function checkPublishedModel() {
  // Get published models
  const response = await fetch(`${SUPABASE_URL}/rest/v1/published_models?select=*`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    }
  })

  if (!response.ok) {
    console.error('Error:', await response.text())
    process.exit(1)
  }

  const models = await response.json()

  console.log('\n📦 Published Models:\n')
  models.forEach(model => {
    console.log(`   Name: "${model.name}"`)
    console.log(`   Category: ${model.category || 'NO CATEGORY FIELD'}`)
    console.log(`   Specialty: ${model.specialty}`)
    console.log(`   Video ID: ${model.video_id}`)
    console.log('')
  })

  // Check if category column exists
  if (models.length > 0 && !('category' in models[0])) {
    console.log('❌ PROBLEM: category column does NOT exist in published_models table!')
    console.log('   You MUST run the migration SQL in Supabase:\n')
    console.log('   ALTER TABLE published_models ADD COLUMN IF NOT EXISTS category TEXT;')
    console.log('   CREATE INDEX IF NOT EXISTS published_models_category_idx ON published_models(category);\n')
  } else if (models.length > 0 && !models[0].category) {
    console.log('⚠️  PROBLEM: Model was published WITHOUT a category!')
    console.log('   Please delete this model and re-publish with category selected.\n')
  } else if (models.length > 0) {
    console.log('✅ Model has category field set correctly!')
  }
}

checkPublishedModel()
