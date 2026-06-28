import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Call Python backend to get status
    const response = await fetch(`${PYTHON_BACKEND_URL}/status/${id}`)

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
    console.error("HumanEgo status check error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get status" },
      { status: 500 }
    )
  }
}
