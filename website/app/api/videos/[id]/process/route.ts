import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getServiceRoleClient } from '@/lib/supabase'

/**
 * POST /api/videos/[id]/process
 *
 * Automatically process a video to extract trajectories
 * (Like HumanEgo automatic processing)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const { id: videoId } = await params
    const supabase = getServiceRoleClient()

    // Get video details
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single()

    if (videoError || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Update video status to processing
    await supabase
      .from('videos')
      .update({ status: 'processing' })
      .eq('id', videoId)

    // Mark as background job
    // In production, you'd use a queue (BullMQ, Inngest, etc.)
    return NextResponse.json({
      success: true,
      message: 'Video processing started in background',
      videoId,
      status: 'processing',
      note: 'Processing happens in browser - use the UI to track progress'
    })
  } catch (error: any) {
    console.error('Error starting video processing:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to start processing'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/videos/[id]/process
 *
 * Check processing status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const { id: videoId } = await params
    const supabase = getServiceRoleClient()

    // Check if trajectories exist for this video
    const { data: trajectories, error } = await supabase
      .from('video_trajectories')
      .select('id, processing_status, total_frames, duration')
      .eq('video_id', videoId)

    if (error) {
      console.error('Error fetching trajectories:', error)
    }

    const hasTrajectories = trajectories && trajectories.length > 0
    const isProcessed = hasTrajectories && trajectories[0].processing_status === 'completed'

    return NextResponse.json({
      success: true,
      videoId,
      hasTrajectories,
      isProcessed,
      trajectories: trajectories || []
    })
  } catch (error: any) {
    console.error('Error checking processing status:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to check status'
      },
      { status: 500 }
    )
  }
}
