export type VideoPlayerRepositoryApiCallResult<T = any> = T extends void ? { error?: string } | undefined : {
    data?: T,
    error?: string
} | undefined

export type VideoPlayerRepositoryPlaybackStatus = {
    percentageComplete: number,
    state: VideoPlayerRepositoryPlaybackState,
    fileName: string
}

export type VideoPlayerRepositoryPlaybackState = "paused" | "playing" | "stopped"
