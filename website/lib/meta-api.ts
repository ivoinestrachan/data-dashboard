const META_GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v21.0'
const GRAPH_API_BASE = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`

export interface MetaVideo {
  id: string
  caption?: string
  media_type: string
  media_url: string
  thumbnail_url?: string
  timestamp: string
  permalink: string
}

export interface MetaMediaResponse {
  data: MetaVideo[]
  paging?: {
    cursors: {
      before: string
      after: string
    }
    next?: string
  }
}

/**
 * Get user's Instagram account ID
 */
export async function getInstagramAccountId(accessToken: string): Promise<string> {
  const response = await fetch(
    `${GRAPH_API_BASE}/me/accounts?fields=instagram_business_account&access_token=${accessToken}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Instagram account')
  }

  const data = await response.json()

  if (!data.data || data.data.length === 0) {
    throw new Error('No Instagram Business Account found')
  }

  const instagramAccount = data.data[0]?.instagram_business_account

  if (!instagramAccount) {
    throw new Error('No Instagram Business Account linked to this Facebook account')
  }

  return instagramAccount.id
}

/**
 * Fetch media (videos) from Instagram account
 */
export async function getInstagramMedia(
  accessToken: string,
  limit: number = 25
): Promise<MetaMediaResponse> {
  try {
    // First get the Instagram account ID
    const accountId = await getInstagramAccountId(accessToken)

    // Then fetch media
    const response = await fetch(
      `${GRAPH_API_BASE}/${accountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink&limit=${limit}&access_token=${accessToken}`
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to fetch media')
    }

    const data = await response.json()

    // Filter for videos only
    const videos = data.data?.filter((item: MetaVideo) => item.media_type === 'VIDEO') || []

    return {
      data: videos,
      paging: data.paging
    }
  } catch (error) {
    console.error('Error fetching Instagram media:', error)
    throw error
  }
}

/**
 * Get a specific media item by ID
 */
export async function getMediaById(
  accessToken: string,
  mediaId: string
): Promise<MetaVideo> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${mediaId}?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink&access_token=${accessToken}`
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to fetch media')
  }

  return await response.json()
}

/**
 * Get user profile information
 */
export async function getUserProfile(accessToken: string) {
  const response = await fetch(
    `${GRAPH_API_BASE}/me?fields=id,name,email&access_token=${accessToken}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch user profile')
  }

  return await response.json()
}
