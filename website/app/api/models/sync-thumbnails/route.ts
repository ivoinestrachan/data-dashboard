import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getServiceRoleClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }

    const supabase = getServiceRoleClient()

    // Get all published models
    const { data: models, error: modelsError } = await supabase
      .from('published_models')
      .select('id, video_id, thumbnail_url')

    if (modelsError) {
      console.error("Error fetching models:", modelsError)
      return NextResponse.json(
        { success: false, error: "Failed to fetch models" },
        { status: 500 }
      )
    }

    // Update each model with thumbnail from its video
    let updatedCount = 0
    for (const model of models || []) {
      if (model.video_id) {
        // Get the video's thumbnail
        const { data: video, error: videoError } = await supabase
          .from('videos')
          .select('thumbnail_url')
          .eq('id', model.video_id)
          .single()

        if (!videoError && video?.thumbnail_url) {
          // Update the model with the thumbnail
          const { error: updateError } = await supabase
            .from('published_models')
            .update({ thumbnail_url: video.thumbnail_url })
            .eq('id', model.id)

          if (!updateError) {
            updatedCount++
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${updatedCount} model thumbnails`,
      updatedCount
    })
  } catch (error: any) {
    console.error("Error syncing thumbnails:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to sync thumbnails"
      },
      { status: 500 }
    )
  }
}
