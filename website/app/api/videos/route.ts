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

    // Get limit from query params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "25")

    const supabase = getServiceRoleClient()

    // Fetch videos from Supabase
    const { data: videos, error, count } = await supabase
      .from('videos')
      .select('*', { count: 'exact' })
      .order('uploaded_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Supabase query error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch videos from database"
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      videos: videos || [],
      count: videos?.length || 0,
      total: count || 0
    })
  } catch (error: any) {
    console.error("Error fetching videos:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch videos"
      },
      { status: 500 }
    )
  }
}
