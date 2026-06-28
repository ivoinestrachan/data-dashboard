import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Using Supabase URL:', SUPABASE_URL ? 'loaded' : 'missing')

async function clearModels() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/published_models?id=neq.00000000-0000-0000-0000-000000000000`, {
    method: 'DELETE',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'return=minimal'
    }
  })

  if (!response.ok) {
    console.error('Error clearing models:', await response.text())
    process.exit(1)
  }

  console.log('✅ All published models deleted successfully!')
}

clearModels()
