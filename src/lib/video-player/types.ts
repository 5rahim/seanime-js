export type VideoPlayerRepositoryApiCallResult<T = any> = T extends void ? { error?: string } | undefined : {
    data?: T,
    error?: string
} | undefined

export type VideoPlayerRepositoryPlaybackStatus = {
    percentageComplete: number,
    state: VideoPlayerRepositoryPlaybackState,
    fileName: string
    duration: number // In ms
}

export type VideoPlayerRepositoryPlaybackState = "paused" | "playing" | "stopped"
