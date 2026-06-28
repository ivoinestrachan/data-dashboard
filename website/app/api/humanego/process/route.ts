import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { video_id, video_path, task_name } = body

    if (!video_id || !video_path) {
      return NextResponse.json(
        { error: "video_id and video_path are required" },
        { status: 400 }
      )
    }

    // Call Python backend to start processing
    const response = await fetch(`${PYTHON_BACKEND_URL}/process/url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_id,
        video_path,
        task_name,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Python backend error: ${error}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error("HumanEgo processing error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to start processing" },
      { status: 500 }
    )
  }
}
