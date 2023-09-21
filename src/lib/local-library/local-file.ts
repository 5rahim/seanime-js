"use server"
import rakun from "@/lib/rakun"
import { Settings } from "@/atoms/settings"
import { AnilistShortMedia, AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { findBestCorrespondingMedia } from "@/lib/local-library/media-matching"
import { ScanLogging } from "@/lib/local-library/logs"
import { getDirectoryPath, removeTopPath, splitFolderPath } from "@/lib/helpers/path"
import {
    getLocalFileParsedEpisode,
    getLocalFileParsedSeason,
    valueContainsNC,
    valueContainsSpecials,
} from "@/lib/local-library/utils"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeShortMediaByIdDocument } from "@/gql/graphql"
import { findMediaEdge } from "@/lib/anilist/utils"
import { normalizeMediaEpisode } from "@/lib/anilist/actions"
import { LocalFile, LocalFileWithMedia } from "@/lib/local-library/types"
import axios from "axios"

/**
 * @description
 * [LocalFile] represents a file on the host machine.
 * - Use [path] to identity the file
 *
 * - parsedInfo: Parsed info from the file name
 *      - Is undefined if we can't parse a title from the file name or folders
 *      - It is undefined if we can't parse an episode
 * - parsedFolderInfo: Parsed info from each parent folder
 *      - Is undefined if we can't parse a title or a season
 */
export const createLocalFile = async (settings: Settings, initialProps: Pick<LocalFile, "name" | "path">, _scanLogging: ScanLogging): Promise<LocalFile> => {

    _scanLogging.add(initialProps.path, ">>> [local-file/createLocalFile]")
    _scanLogging.add(initialProps.path, "Parsing data from file name")

    try {
        // Remove local directory
        const folderPath = removeTopPath(getDirectoryPath(initialProps.path), settings.library.localDirectory!)
        const parsed = rakun.parse(initialProps.name)
        const parsedInfo = {
            original: parsed.filename,
            title: parsed.name,
            releaseGroup: parsed.releaseGroup,
            season: parsed.season,
            part: parsed.part,
            cour: parsed.cour,
            episode: parsed.episode,
            episodeTitle: parsed.episodeTitle,
        }
        _scanLogging.add(initialProps.path, `   -> Parsed from file name ` + JSON.stringify(parsedInfo))
        _scanLogging.add(initialProps.path, "Parsing data from parent folders")

        const folders = splitFolderPath(folderPath)
        const parsedFolderInfo = folders?.map(folder => {
            const obj = rakun.parse(folder)
            // Keep the folder which has a parsed title or parsed season
            if (obj.name || obj.season) {
                return ({
                    original: folder,
                    title: obj.name,
                    releaseGroup: obj.releaseGroup,
                    season: obj.season,
                    part: obj.part,
                    cour: obj.cour,
                    episode: obj.episode,
                    episodeTitle: parsed.episodeTitle,
                })
            }
        }).filter(Boolean)
        _scanLogging.add(initialProps.path, `   -> Parsed from parent folders ` + JSON.stringify(parsedFolderInfo))

        const branchHasTitle = !!parsed.name || parsedFolderInfo.some(obj => !!obj.title)

        if (!branchHasTitle) {
            _scanLogging.add(initialProps.path, `   -> warning - Could not parse anime title`)
        }

        return {
            path: initialProps.path,
            name: initialProps.name,
            parsedInfo: (branchHasTitle) ? parsedInfo : undefined,
            parsedFolderInfo,
            metadata: {}, // Will be hydrated
            locked: false, // Default values, will be hydrated later
            ignored: false, // Default values, will be hydrated later
            mediaId: null, // Default values, will be hydrated later
        }
    } catch (e) {
        _scanLogging.add(initialProps.path, `   -> error - Parsing error`)

        return {
            path: initialProps.path,
            name: initialProps.name,
            parsedInfo: undefined,
            parsedFolderInfo: [],
            metadata: {},
            locked: false,
            ignored: false,
            mediaId: null,
        }

    }
}

/* -------------------------------------------------------------------------------------------------
 * Match local files
 * -----------------------------------------------------------------------------------------------*/

/**
 * @description
 * This method take a [LocalFile] and an array of [AnilistShortMedia] fetched from AniList.
 * We compare the filenames, anime title, folder title to get the best match.
 */
export const createLocalFileWithMedia = async (props: {
    file: LocalFile,
    allMedia: AnilistShowcaseMedia[],
    mediaTitles: { eng: string[], rom: string[], preferred: string[], synonymsWithSeason: string[] },
    _matchingCache: Map<string, AnilistShowcaseMedia | undefined>,
    _scanLogging: ScanLogging,
}): Promise<LocalFileWithMedia | undefined> => {

    const { allMedia, file, mediaTitles, _matchingCache, _scanLogging } = props

    if (allMedia.length > 0) {

        let correspondingMedia: AnilistShowcaseMedia | undefined = undefined

        // Find the corresponding media only if:
        // The file has been parsed AND it has an anime title OR one of its folders has an anime title
        if (!!file.parsedInfo && (!!file.parsedInfo?.title || file.parsedFolderInfo.some(n => !!n.title))) {

            const { correspondingMedia: media } = await findBestCorrespondingMedia({
                file,
                allMedia,
                mediaTitles,
                parsed: file.parsedInfo,
                parsedFolderInfo: file.parsedFolderInfo,
                _matchingCache,
                _scanLogging,
            })
            correspondingMedia = media

        } else {
            _scanLogging.add(file.path, "error - Could not parse any info, file will not be matched")
        }

        return {
            ...file,
            media: correspondingMedia,
            // mediaId: correspondingMedia?.id || null <- Don't need it, will be hydrated later
        }
    }
    return undefined
}

/* -------------------------------------------------------------------------------------------------
 * Metadata
 * -----------------------------------------------------------------------------------------------*/

/**
 * @description
 * Analyzes [LocalFile]'s parsed data and returns appropriate cloned [LocalFile] with hydrated metadata
 * @param props
 */
export async function hydrateLocalFileWithInitialMetadata(props: {
    file: LocalFile,
    media: AnilistShowcaseMedia
    _cache: Map<number, AnilistShortMedia>
    _aniZipCache?: Map<number, AniZipData>
    _scanLogging: ScanLogging
}) {

    const { file: _originalFile, media, _cache, _scanLogging, _aniZipCache } = props

    let file = structuredClone(_originalFile)

    _scanLogging.add(file.path, ">>> [local-file/hydrateLocalFileWithInitialMetadata]")
    _scanLogging.add(file.path, "Hydrating metadata")

    if (media.format !== "MOVIE") {
        // Get the highest episode number
        const highestEp = media?.nextAiringEpisode?.episode || media?.episodes

        const season = getLocalFileParsedSeason(file.parsedInfo, file.parsedFolderInfo)
        const episode = getLocalFileParsedEpisode(file.parsedInfo)


        // The parser got an absolute episode number, we will normalize it and give the file the correct ID
        if (!!highestEp && !!episode && episode > highestEp) {

            _scanLogging.add(file.path, "warning - Absolute episode number detected")

            // Fetch the same media but with all necessary info (relations prop) to find the relative episode
            let fetchedMedia: AnilistShortMedia | null | undefined

            _scanLogging.add(file.path, "   -> Analyzing media relations [AnimeShortMediaByIdDocument]")

            if (!_cache.has(media.id) || !_cache.get(media.id)?.relations) {
                _scanLogging.add(file.path, "   -> Cache MISS - Querying media relations")
                fetchedMedia = (await useAniListAsyncQuery(AnimeShortMediaByIdDocument, { id: media.id })).Media
                if (fetchedMedia) _cache.set(media.id, fetchedMedia)
            } else {
                _scanLogging.add(file.path, "   -> Cache HIT - Related media retrieved")
                fetchedMedia = _cache.get(media.id)
            }

            _scanLogging.add(file.path, "   -> Normalizing episode number")

            const prequel = !season ? (
                findMediaEdge(fetchedMedia, "PREQUEL")?.node
                || ((fetchedMedia?.format === "OVA" || fetchedMedia?.format === "ONA")
                    ? findMediaEdge(fetchedMedia, "PARENT")?.node
                    : undefined)
            ) : undefined


            // Don't know how but this works for now
            let result = await normalizeMediaEpisode({
                media: prequel || fetchedMedia,
                episode: episode,
                _cache: _cache,
                increment: !season ? null : true,
            })
            if (result?.offset === 0) {
                result = await normalizeMediaEpisode({
                    media: fetchedMedia,
                    episode: episode,
                    _cache: _cache,
                    force: true,
                })
            }

            let normalizedEpisodeNumber = result?.episode

            // Double-check with AniZip
            // Why? [normalizeMediaEpisode] might sometimes return the wrong offset but hopefully `result.rootMedia` is the correct one
            // Get AniZip data for the appropriate media
            let aniZipData: AniZipData | null | undefined = null
            if (result?.rootMedia?.id) {
                if (_aniZipCache?.has(result.rootMedia.id)) {
                    aniZipData = _aniZipCache?.get(result.rootMedia.id)
                } else {
                    const aniZipRes = await Promise.allSettled([axios.get<AniZipData>(`https://api.ani.zip/mappings?anilist_id=${result.rootMedia.id}`)])
                    if (aniZipRes[0].status === "fulfilled") {
                        aniZipData = aniZipRes[0].value.data
                        _aniZipCache?.set(result.rootMedia.id, aniZipData)
                    }
                }
            }
            if (aniZipData && aniZipData?.episodes?.["1"]?.absoluteEpisodeNumber && result?.episode) {
                const offset = aniZipData.episodes["1"].absoluteEpisodeNumber - 1 // Get the offset from AniZip
                const aniZipCurrentRelativeEpisode = episode - offset
                if (aniZipCurrentRelativeEpisode !== result.episode) { // If the relative episodes differ, replace it
                    normalizedEpisodeNumber = aniZipCurrentRelativeEpisode
                }
            }

            if (normalizedEpisodeNumber === episode) { // This might happen only when the media format is not defined,and it might be a movie
                _scanLogging.add(file.path, `   -> Normalization found the same episode numbers (${normalizedEpisodeNumber})`)
                if (media.episodes && media.episodes < episode) {
                    _scanLogging.add(file.path, `   -> Ceiling is ${media.episodes}, changing episode ${episode} to ${media.episodes}`)
                    file.metadata.episode = media.episodes
                    file.metadata.aniDBEpisodeNumber = String(media.episodes)
                }
            } else {
                _scanLogging.add(file.path, `   -> Normalization mapped episode ${episode} to ${normalizedEpisodeNumber}`)
                if (result?.rootMedia && normalizedEpisodeNumber && normalizedEpisodeNumber > 0) {
                    // Replace episode and mediaId
                    file.metadata.episode = normalizedEpisodeNumber
                    file.metadata.aniDBEpisodeNumber = String(normalizedEpisodeNumber)
                    file.mediaId = result.rootMedia.id

                    _scanLogging.add(file.path, `   -> Overriding Media ID ${media.id} to ${result.rootMedia.id}`)
                } else {
                    file.metadata.episode = episode
                    file.metadata.aniDBEpisodeNumber = String(episode)

                    _scanLogging.add(file.path, `   -> error - Could not normalize the episode number`)
                }
            }
        } else {
            if (!!episode) {
                _scanLogging.add(file.path, `   -> episode = ${episode}`)
                _scanLogging.add(file.path, `   -> aniDBEpisodeNumber = ${episode}`)

                file.metadata.episode = episode
                file.metadata.aniDBEpisodeNumber = String(episode)
            } else {
                _scanLogging.add(file.path, `   -> No episode parsed but media format is not "MOVIE"`)
                if ((!!media.episodes && media.episodes === 1)) {
                    _scanLogging.add(file.path, `   -> Ceiling is 1, setting episode number 1`)
                    file.metadata.episode = 1
                    file.metadata.aniDBEpisodeNumber = "1"
                } else {
                    _scanLogging.add(file.path, `error - Potential parsing error, episode number is undefined`)
                }
            }
        }

        // We already know the media isn't a movie
        // eg: One Punch Man > One Punch Man OVA 01.mkv -> Matched with "One Punch Man" whose format is TV -> isSpecial = true
        // Marking an episode as Special will allow better mapping with AniDB -> episodes[aniDBEpisodeNumber]
        if (valueContainsSpecials(file.name)) {
            file.metadata.isSpecial = true
            file.metadata.aniDBEpisodeNumber = "S" + String(file.metadata.episode ?? 1)
            _scanLogging.add(file.path, `   -> isSpecial = true`)
            _scanLogging.add(file.path, `   -> aniDBEpisodeNumber = S${String(file.metadata.episode ?? 1)} (overwritten)`)
        } else if (valueContainsNC(file.name)) {
            file.metadata.isNC = true
            _scanLogging.add(file.path, `   -> isNC = true`)
        }

    } else {
        if ((media.format === "MOVIE" && media.episodes === 1) || (!!media.episodes && media.episodes === 1)) {
            _scanLogging.add(file.path, "Hydrating movie metadata")
            file.metadata.episode = 1
            file.metadata.aniDBEpisodeNumber = "1"
        }
    }

    return file

}
