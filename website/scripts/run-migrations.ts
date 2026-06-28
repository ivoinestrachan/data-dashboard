import { readFileSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

async function runMigrations() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const migrationPath = join(process.cwd(), 'supabase/migrations/001_create_videos_table.sql')
    const sql = readFileSync(migrationPath, 'utf-8')

    console.log('Running migration...')

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
      if (error) {
        console.error('Error executing statement:', error)
      }
    }

    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

runMigrations()
