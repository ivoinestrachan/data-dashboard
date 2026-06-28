import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

// Load environment variables
config({ path: '.env.local' })

async function deleteAllVideos() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createClient(supabaseUrl, supabaseKey, {
    realtime: {
      transport: ws as any
    }
  })

  try {
    console.log('Fetching all videos...')

    // Get all videos
    const { data: videos, error: fetchError } = await supabase
      .from('videos')
      .select('*')

    if (fetchError) {
      console.error('Error fetching videos:', fetchError)
      return
    }

    console.log(`Found ${videos?.length || 0} videos`)

    if (!videos || videos.length === 0) {
      console.log('No videos to delete')
      return
    }

    // Delete files from storage
    console.log('Deleting files from storage...')
    const storagePaths = videos.map(v => v.storage_path)
    const { error: storageError } = await supabase.storage
      .from('videos')
      .remove(storagePaths)

    if (storageError) {
      console.error('Error deleting from storage:', storageError)
    } else {
      console.log(`Deleted ${storagePaths.length} files from storage`)
    }

    // Delete records from database
    console.log('Deleting records from database...')
    const { error: deleteError } = await supabase
      .from('videos')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      console.error('Error deleting from database:', deleteError)
    } else {
      console.log('✅ All videos deleted successfully!')
    }

  } catch (error) {
    console.error('❌ Failed:', error)
    throw error
  }
}

deleteAllVideos()
