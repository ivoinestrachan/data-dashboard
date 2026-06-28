import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function runMigration() {
  console.log('Running migration: Add category column to published_models...')

  const sql = `
    ALTER TABLE published_models ADD COLUMN IF NOT EXISTS category TEXT;
    CREATE INDEX IF NOT EXISTS published_models_category_idx ON published_models(category);
  `

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  })

  if (response.ok) {
    console.log('✅ Migration completed successfully!')
  } else {
    const error = await response.text()
    console.log('Note: Migration may have already run or RPC not available')
    console.log('Please run this SQL manually in Supabase SQL Editor:')
    console.log('')
    console.log(sql.trim())
    console.log('')
  }
}

runMigration()
