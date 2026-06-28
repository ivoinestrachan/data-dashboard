import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getServiceRoleClient } from "@/lib/supabase"
import crypto from "crypto"
import ffmpeg from "fluent-ffmpeg"
import { writeFile, unlink, readFile } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"

// Set ffmpeg paths
ffmpeg.setFfmpegPath('/usr/local/bin/ffmpeg')
ffmpeg.setFfprobePath('/opt/homebrew/bin/ffprobe')

export async function POST(request: NextRequest) {
  let tempVideoPath: string | null = null
  let tempConvertedPath: string | null = null
  let tempThumbnailPath: string | null = null

  try {
    // Check authentication
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("video") as File
    const title = formData.get("title") as string || "Untitled Video"
    const description = formData.get("description") as string || undefined
    const recordedAt = formData.get("recordedAt") as string || new Date().toISOString()
    const metadata = formData.get("metadata") as string

    if (!file) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 }
      )
    }

    const supabase = getServiceRoleClient()

    // Always save as MP4
    const filename = `${crypto.randomUUID()}.mp4`
    const thumbnailFilename = `${crypto.randomUUID()}.jpg`
    const storagePath = `videos/${filename}`
    const thumbnailPath = `thumbnails/${thumbnailFilename}`

    // Save original video temporarily
    const fileExtension = file.name.split('.').pop() || 'mp4'
    tempVideoPath = join(tmpdir(), `original-${Date.now()}.${fileExtension}`)
    tempConvertedPath = join(tmpdir(), `converted-${Date.now()}.mp4`)
    tempThumbnailPath = join(tmpdir(), `thumb-${Date.now()}.jpg`)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(tempVideoPath, buffer)

    // Convert to MP4 if not already MP4
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempVideoPath!)
        .outputOptions([
          '-c:v libx264',     // Video codec
          '-preset fast',      // Encoding speed
          '-crf 23',          // Quality (lower = better, 23 is default)
          '-c:a aac',         // Audio codec
          '-b:a 128k'         // Audio bitrate
        ])
        .output(tempConvertedPath!)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run()
    })

    // Get video metadata (duration) from converted file
    let videoDuration = 0
    await new Promise<void>((resolve, reject) => {
      ffmpeg.ffprobe(tempConvertedPath!, (err, metadata) => {
        if (err) {
          console.error('Error getting video metadata:', err)
          resolve() // Continue even if metadata extraction fails
        } else {
          videoDuration = Math.floor(metadata.format.duration || 0)
          resolve()
        }
      })
    })

    // Generate thumbnail using ffmpeg (maintain aspect ratio)
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempConvertedPath!)
        .screenshots({
          timestamps: ['1'], // Take screenshot at 1 second
          filename: tempThumbnailPath!.split('/').pop()!,
          folder: tmpdir(),
          size: '640x?'  // Width 640, height auto to maintain aspect ratio
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
    })

    // Read converted MP4 file
    const convertedBuffer = await readFile(tempConvertedPath!)

    // Upload MP4 video to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(storagePath, convertedBuffer, {
        contentType: 'video/mp4',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload video to storage" },
        { status: 500 }
      )
    }

    // Upload thumbnail to Supabase Storage
    const thumbnailBuffer = await import('fs/promises').then(fs => fs.readFile(tempThumbnailPath!))
    const { error: thumbnailError } = await supabase.storage
      .from('videos')
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      })

    // Get public URLs
    const { data: videoUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(storagePath)

    const { data: thumbnailUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(thumbnailPath)

    // Insert video record into database
    const { data: videoData, error: dbError } = await supabase
      .from('videos')
      .insert({
        title,
        description,
        filename,
        storage_path: storagePath,
        video_url: videoUrlData.publicUrl,
        thumbnail_url: thumbnailError ? null : thumbnailUrlData.publicUrl,
        duration: videoDuration,
        size: convertedBuffer.length,  // Use converted file size
        mime_type: 'video/mp4',  // Always MP4 now
        recorded_at: recordedAt,
        uploaded_at: new Date().toISOString(),
        metadata: metadata ? JSON.parse(metadata) : null
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database insert error:", dbError)
      // Try to delete uploaded files if database insert fails
      await supabase.storage.from('videos').remove([storagePath, thumbnailPath])
      return NextResponse.json(
        { error: "Failed to save video metadata" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      video: videoData
    })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    )
  } finally {
    // Clean up temporary files
    if (tempVideoPath) {
      try {
        await unlink(tempVideoPath)
      } catch (e) {
        console.error("Failed to delete temp video:", e)
      }
    }
    if (tempConvertedPath) {
      try {
        await unlink(tempConvertedPath)
      } catch (e) {
        console.error("Failed to delete converted video:", e)
      }
    }
    if (tempThumbnailPath) {
      try {
        await unlink(tempThumbnailPath)
      } catch (e) {
        console.error("Failed to delete temp thumbnail:", e)
      }
    }
  }
}
