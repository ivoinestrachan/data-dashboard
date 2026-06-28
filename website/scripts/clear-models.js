const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    realtime: {
      disabled: true
    }
  }
)

async function clearModels() {
  const { data, error } = await supabase
    .from('published_models')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) {
    console.error('Error clearing models:', error)
    process.exit(1)
  }

  console.log('✅ All published models deleted successfully!')
}

clearModels()
