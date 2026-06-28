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

    // Delete all published models
    const { error } = await supabase
      .from('published_models')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

    if (error) {
      console.error("Error clearing models:", error)
      return NextResponse.json(
        { success: false, error: "Failed to clear models" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "All published models cleared successfully"
    })
  } catch (error: any) {
    console.error("Error clearing models:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to clear models"
      },
      { status: 500 }
    )
  }
}
