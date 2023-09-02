import { ArtPlayer } from "../art-player/player"
import { useEffect, useState } from "react"
import artplayerPluginHlsQuality from "artplayer-plugin-hls-quality"
import { useRouter } from "next/navigation"
import { ConsumetStreamingData } from "@/lib/consumet/types"
import Artplayer from "artplayer"

const fontSize = [
    {
        html: "Small",
        size: "16px",
    },
    {
        html: "Medium",
        size: "36px",
    },
    {
        html: "Large",
        size: "56px",
    },
]

export function VideoStreamer(
    {
        data,
        id,
        session,
        aniId,
        skip,
        title,
        poster,
        proxy = "https://nextjs-cors-anywhere.vercel.app",
        provider = "gogoanime",
        track,
        timeWatched,
        dub,
    }: {
        data: ConsumetStreamingData,
        id: string,
        session?: any,
        aniId: any,
        skip?: any,
        title?: any,
        poster?: any,
        proxy?: string
        provider?: string,
        track?: any,
        timeWatched?: any,
        dub?: any,
    },
) {
    const [url, setUrl] = useState<string>("")
    const [sources, setSources] = useState<ConsumetStreamingData["sources"]>([])

    const router = useRouter()

    const [resolution, setResolution] = useState("auto")
    const [subSize, setSubSize] = useState<any>({ size: "16px", html: "Small" })
    const [defSize, setDefSize] = useState<any>()
    const [subtitle, setSubtitle] = useState<any>()
    const [defSub, setDefSub] = useState<string | undefined>()

    const [autoPlay, setAutoPlay] = useState(false)

    useEffect(() => {
        const resol = localStorage.getItem("quality")
        // const sub = JSON.parse(localStorage.getItem("subSize"))
        if (resol) {
            setResolution(resol)
        }

        if (provider === "zoro") {
            const size = fontSize.map((i) => {
                // const isDefault = !sub ? i.html === "Small" : i.html === sub?.html
                const isDefault = i.html === "Small"
                return {
                    ...(isDefault && { default: true }),
                    html: i.html,
                    size: i.size,
                }
            })

            const defSize = size?.find((i) => i?.default === true)
            setDefSize(defSize)
            setSubSize(size)
        }

        async function compiler() {
            try {
                const referer = data?.headers?.Referer
                const source = data.sources.map((src) => {
                    const isDefault =
                        provider !== "gogoanime"
                            ? src.quality === "default" || src.quality === "auto"
                            : resolution === "auto"
                                ? src.quality === "default" || src.quality === "auto"
                                : src.quality === resolution
                    return {
                        ...src,
                        ...(isDefault && { default: true }),
                        html: src.quality === "default" ? "adaptive" : src.quality,
                        url:
                            provider === "gogoanime"
                                ? `https://cors.moopa.workers.dev/?url=${encodeURIComponent(
                                    src.url,
                                )}${referer ? `&referer=${encodeURIComponent(referer)}` : ""}`
                                : `${proxy}${src.url}`,
                    }
                })

                const defSource = source?.find((i) => i?.default === true)

                if (defSource) {
                    setUrl(defSource.url)
                }

                if (provider === "zoro") {
                    const subtitle = data?.subtitles?.filter((subtitle) => subtitle.lang !== "Thumbnails")?.map((subtitle) => {
                        const isEnglish = subtitle.lang === "English"
                        return {
                            ...subtitle,
                            ...(isEnglish && { default: true }), // Set english as default
                            url: subtitle.url,
                            html: `${subtitle.lang}`,
                        }
                    })

                    const defSub = data?.subtitles?.find((i) => i.lang === "English")

                    if (defSub) setDefSub(defSub?.url)
                    if (subtitle) setSubtitle(subtitle)
                }

                setSources(source)
            } catch (error) {
                console.error(error)
            }
        }

        compiler()
    }, [data, resolution])

    return (
        <>
            {url && (
                <ArtPlayer
                    key={url}
                    option={{
                        url: `${url}`,
                        // title: `${title}`,
                        autoplay: false,
                        screenshot: true,
                        moreVideoAttr: {
                            crossOrigin: "anonymous",
                        },
                        poster: poster ? poster : "",
                        ...(provider !== "gogoanime" && {
                            plugins: [
                                artplayerPluginHlsQuality({
                                    // Show quality in setting
                                    setting: true,
                                    // Get the resolution text from level
                                    getResolution: (level) => level.height + "P",
                                    // I18n
                                    title: "Quality",
                                    auto: "Auto",
                                }),
                            ],
                        }),
                        ...(provider === "zoro" && {
                            subtitle: {
                                url: `${defSub}`,
                                // type: "vtt",
                                encoding: "utf-8",
                                //@ts-ignore
                                default: true,
                                name: "English",
                                escape: false,
                                style: {
                                    color: "#FFFF",
                                    fontSize: `${defSize?.size}`,
                                    fontFamily: localStorage.getItem("font")
                                        ? localStorage.getItem("font")
                                        : "Arial",
                                    textShadow: localStorage.getItem("subShadow")
                                        ? (JSON.parse(localStorage.getItem("subShadow") || "{ value: 0px 0px 10px #000000 }") as any).value
                                        : "0px 0px 10px #000000",
                                },
                            },
                        }),
                    }}
                    id={aniId}
                    res={resolution}
                    quality={sources}
                    subSize={subSize}
                    subtitles={subtitle}
                    provider={provider}
                    track={track}
                    autoplay={autoPlay}
                    setautoplay={setAutoPlay}
                    style={{
                        width: "100%",
                        height: "100%",
                        margin: "0 auto 0",
                    }}
                    getInstance={(art: Artplayer) => {
                        art.on("ready", () => {
                            const seek = art.storage.get(id)
                            const seekTime = seek?.timeWatched || 0
                            const duration = art.duration
                            const percentage = seekTime / duration
                            const percentagedb = timeWatched / duration

                            if (subSize) {
                                // @ts-ignore
                                art.subtitle.style.fontSize = subSize?.size
                            }

                            if (percentage >= 0.9 || percentagedb >= 0.9) {
                                art.currentTime = 0
                                console.log("Video started from the beginning")
                            } else if (timeWatched) {
                                art.currentTime = timeWatched
                            } else {
                                art.currentTime = seekTime
                            }
                        })

                        let marked = 0

                        art.on("video:playing", () => {
                            if (!session) return
                            // const intervalId = setInterval(async () => {
                            //     const resp = await fetch("/api/user/update/episode", {
                            //         method: "PUT",
                            //         body: JSON.stringify({
                            //             name: session?.user?.name,
                            //             id: String(aniId),
                            //             watchId: id,
                            //             title: track?.playing?.title || aniTitle,
                            //             aniTitle: aniTitle,
                            //             image: track?.playing?.image || info?.coverImage?.extraLarge,
                            //             number: Number(progress),
                            //             duration: art.duration,
                            //             timeWatched: art.currentTime,
                            //             provider: provider,
                            //         }),
                            //     })
                            //     // console.log("updating db");
                            // }, 5000)

                            // art.on("video:pause", () => {
                            //     clearInterval(intervalId)
                            // })
                            //
                            // art.on("video:ended", () => {
                            //     clearInterval(intervalId)
                            // })
                            //
                            // art.on("destroy", () => {
                            //     clearInterval(intervalId)
                            //     // console.log("clearing interval");
                            // })
                        })

                        // art.on("video:playing", () => {
                        //     const interval = setInterval(async () => {
                        //         art.storage.set(id, {
                        //             aniId: String(aniId),
                        //             watchId: id,
                        //             title: track?.playing?.title || aniTitle,
                        //             aniTitle: aniTitle,
                        //             image: track?.playing?.image || info?.coverImage?.extraLarge,
                        //             episode: Number(progress),
                        //             duration: art.duration,
                        //             timeWatched: art.currentTime,
                        //             provider: provider,
                        //             createdAt: new Date().toISOString(),
                        //         })
                        //     }, 5000)
                        //
                        //     art.on("video:pause", () => {
                        //         clearInterval(interval)
                        //     })
                        //
                        //     art.on("video:ended", () => {
                        //         clearInterval(interval)
                        //     })
                        //
                        //     art.on("destroy", () => {
                        //         clearInterval(interval)
                        //     })
                        // })

                        art.on("resize", () => {
                            art.subtitle.style({
                                fontSize: art.height * 0.05 + "px",
                            })
                        })

                        art.on("video:timeupdate", async () => {
                            if (!session) return

                            var currentTime = art.currentTime
                            const duration = art.duration
                            const percentage = currentTime / duration

                            if (percentage >= 0.9) {
                                // use >= instead of >
                                if (marked < 1) {
                                    marked = 1
                                    // markProgress(aniId, progress, stats)
                                }
                            }
                        })

                        art.on("video:ended", () => {
                            if (!track?.next) return
                            if (localStorage.getItem("autoplay") === "true") {
                                art.controls.add({
                                    name: "next-button",
                                    position: "top",
                                    html: "<div class=\"vid-con\"><button class=\"next-button progress\">Play Next</button></div>",
                                    click: function (...args) {
                                        if (track?.next) {
                                            router.push(
                                                `/en/anime/watch/${aniId}/${provider}?id=${encodeURIComponent(
                                                    track?.next?.id,
                                                )}&num=${track?.next?.number}${
                                                    dub ? `&dub=${dub}` : ""
                                                }`,
                                            )
                                        }
                                    },
                                })

                                const button = document.querySelector(".next-button")

                                // function stopTimeout() {
                                //     clearTimeout(timeoutId)
                                //     button.classList.remove("progress")
                                // }

                                // let timeoutId = setTimeout(() => {
                                //     art.controls.remove("next-button")
                                //     if (track?.next) {
                                //         router.push(
                                //             `/en/anime/watch/${aniId}/${provider}?id=${encodeURIComponent(
                                //                 track?.next?.id,
                                //             )}&num=${track?.next?.number}${dub ? `&dub=${dub}` : ""}`,
                                //         )
                                //     }
                                // }, 7000)

                                // button.addEventListener("mouseover", stopTimeout)
                            }
                        })

                        art.on("video:timeupdate", () => {
                            var currentTime = art.currentTime
                            // console.log(art.currentTime);

                            if (
                                skip?.op &&
                                currentTime >= skip.op.interval.startTime &&
                                currentTime <= skip.op.interval.endTime
                            ) {
                                // Add the layer if it's not already added
                                if (!art.controls["op"]) {
                                    // Remove the other control if it's already added
                                    if (art.controls["ed"]) {
                                        art.controls.remove("ed")
                                    }

                                    // Add the control
                                    art.controls.add({
                                        name: "op",
                                        position: "top",
                                        html: "<button class=\"skip-button\">Skip Opening</button>",
                                        click: function (...args) {
                                            art.seek = skip.op.interval.endTime
                                        },
                                    })
                                }
                            } else if (
                                skip?.ed &&
                                currentTime >= skip.ed.interval.startTime &&
                                currentTime <= skip.ed.interval.endTime
                            ) {
                                // Add the layer if it's not already added
                                if (!art.controls["ed"]) {
                                    // Remove the other control if it's already added
                                    if (art.controls["op"]) {
                                        art.controls.remove("op")
                                    }

                                    // Add the control
                                    art.controls.add({
                                        name: "ed",
                                        position: "top",
                                        html: "<button class=\"skip-button\">Skip Ending</button>",
                                        click: function (...args) {
                                            art.seek = skip.ed.interval.endTime
                                        },
                                    })
                                }
                            } else {
                                // Remove the controls if they're added
                                if (art.controls["op"]) {
                                    art.controls.remove("op")
                                }
                                if (art.controls["ed"]) {
                                    art.controls.remove("ed")
                                }
                            }
                        })
                    }}
                />
            )}
        </>
    )
}
