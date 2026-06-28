import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getServiceRoleClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
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

    // Fetch published models from Supabase
    const { data: models, error } = await supabase
      .from('published_models')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Supabase query error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch models from database"
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      models: models || []
    })
  } catch (error: any) {
    console.error("Error fetching models:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch models"
      },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const supabase = getServiceRoleClient()

    // Insert model into Supabase
    const { data: model, error } = await supabase
      .from('published_models')
      .insert([
        {
          name: body.name,
          company: body.company,
          industry: body.industry,
          specialty: body.specialty,
          category: body.category,
          level: body.level,
          cost: body.cost,
          avatar: body.avatar,
          specs: body.specs,
          video_id: body.videoId,
          thumbnail_url: body.thumbnailUrl,
          user_id: session.user?.email || session.user?.id
        }
      ])
      .select()
      .single()

    if (error) {
      console.error("Supabase insert error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to publish model to database"
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      model: model
    })
  } catch (error: any) {
    console.error("Error publishing model:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to publish model"
      },
      { status: 500 }
    )
  }
}
