import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getServiceRoleClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      video_id,
      trajectory_name,
      total_frames,
      duration,
      fps,
      waypoints,
      keypoints,
      annotations
    } = body

    if (!video_id || !waypoints || waypoints.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: video_id and waypoints' },
        { status: 400 }
      )
    }

    const supabase = getServiceRoleClient()
    const userId = session.user?.email || session.user?.id

    // Create trajectory record
    const { data: trajectory, error: trajectoryError } = await supabase
      .from('video_trajectories')
      .insert({
        video_id,
        user_id: userId,
        trajectory_name: trajectory_name || `trajectory_${Date.now()}`,
        total_frames: total_frames || waypoints.length,
        duration: duration || 0,
        fps: fps || 30,
        keypoints: keypoints || [],
        poses: null,
        waypoints: waypoints,
        objects: null,
        depth_maps: null,
        processing_status: 'completed',
        processed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (trajectoryError) {
      console.error('❌ Error creating trajectory:', JSON.stringify(trajectoryError, null, 2))
      return NextResponse.json(
        { error: 'Failed to create trajectory', details: trajectoryError.message, code: trajectoryError.code },
        { status: 500 }
      )
    }

    // Insert waypoints into normalized table
    const waypointRecords = waypoints.map((wp: any) => ({
      trajectory_id: trajectory.id,
      timestamp_ms: wp.timestamp_ms || 0,
      frame_number: wp.frame_number || 0,
      position_x: wp.position_x || 0,
      position_y: wp.position_y || 0,
      position_z: wp.position_z || 0,
      roll: wp.roll || null,
      pitch: wp.pitch || null,
      yaw: wp.yaw || null,
      gripper_state: wp.gripper_state || null,
      gripper_width: wp.gripper_width || null,
      task_phase: wp.task_phase || null,
      action_label: wp.action_label || null,
      position_confidence: wp.confidence || null
    }))

    const { error: waypointsError } = await supabase
      .from('trajectory_waypoints')
      .insert(waypointRecords)

    if (waypointsError) {
      console.error('Error inserting waypoints:', waypointsError)
      // Don't fail the request if waypoints fail
    }

    // Insert keypoints if provided
    if (keypoints && Array.isArray(keypoints) && keypoints.length > 0) {
      const keypointRecords = keypoints.flatMap((kp: any) => {
        return (kp.hands || []).map((hand: any, idx: number) => ({
          trajectory_id: trajectory.id,
          timestamp_ms: kp.timestamp || 0,
          frame_number: kp.frameNumber || 0,
          keypoint_type: hand.handedness === 'Left' ? 'left_hand' : 'right_hand',
          landmarks: hand.landmarks || [],
          world_landmarks: hand.worldLandmarks || [],
          label: hand.handedness || 'Unknown',
          confidence: hand.confidence || 0
        }))
      })

      if (keypointRecords.length > 0) {
        const { error: keypointsError } = await supabase
          .from('trajectory_keypoints')
          .insert(keypointRecords)

        if (keypointsError) {
          console.error('Error inserting keypoints:', keypointsError)
        }
      }
    }

    // Insert annotations if provided
    if (annotations && Array.isArray(annotations) && annotations.length > 0) {
      const annotationRecords = annotations.map((ann: any) => ({
        video_id,
        user_id: userId,
        start_time: ann.startTime || 0,
        end_time: ann.endTime || 0,
        action_label: ann.actionLabel || '',
        task_phase: ann.taskPhase || null,
        object_label: ann.objectLabel || null,
        notes: ann.notes || null,
        metadata: null
      }))

      const { error: annotationsError } = await supabase
        .from('video_annotations')
        .insert(annotationRecords)

      if (annotationsError) {
        console.error('Error inserting annotations:', annotationsError)
      }
    }

    return NextResponse.json({
      success: true,
      trajectory: {
        id: trajectory.id,
        video_id: trajectory.video_id,
        total_frames: trajectory.total_frames,
        duration: trajectory.duration,
        waypoints_count: waypoints.length
      }
    })
  } catch (error: any) {
    console.error('❌ Error saving trajectory:', error)
    console.error('❌ Error stack:', error.stack)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to save trajectory',
        stack: error.stack
      },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch trajectories for a video
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('video_id')

    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing video_id parameter' },
        { status: 400 }
      )
    }

    const supabase = getServiceRoleClient()
    const userId = session.user?.email || session.user?.id

    // Fetch trajectories
    const { data: trajectories, error: trajectoriesError } = await supabase
      .from('video_trajectories')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (trajectoriesError) {
      console.error('Error fetching trajectories:', trajectoriesError)
      return NextResponse.json(
        { error: 'Failed to fetch trajectories', details: trajectoriesError.message },
        { status: 500 }
      )
    }

    // Fetch waypoints for each trajectory
    const trajectoriesWithData = await Promise.all(
      trajectories.map(async (traj) => {
        const { data: waypoints } = await supabase
          .from('trajectory_waypoints')
          .select('*')
          .eq('trajectory_id', traj.id)
          .order('timestamp_ms', { ascending: true })

        const { data: annotations } = await supabase
          .from('video_annotations')
          .select('*')
          .eq('video_id', videoId)

        return {
          ...traj,
          waypoints: waypoints || [],
          annotations: annotations || []
        }
      })
    )

    return NextResponse.json({
      success: true,
      trajectories: trajectoriesWithData
    })
  } catch (error: any) {
    console.error('Error fetching trajectories:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch trajectories'
      },
      { status: 500 }
    )
  }
}
