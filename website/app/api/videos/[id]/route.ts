import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getServiceRoleClient } from "@/lib/supabase"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { title } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    const supabase = getServiceRoleClient()

    // Update video title
    const { data, error } = await supabase
      .from('videos')
      .update({ title: title.trim() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error("Database update error:", error)
      return NextResponse.json(
        { error: "Failed to update video" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      video: data
    })
  } catch (error: any) {
    console.error("Update error:", error)
    return NextResponse.json(
      { error: error.message || "Update failed" },
      { status: 500 }
    )
  }
}
