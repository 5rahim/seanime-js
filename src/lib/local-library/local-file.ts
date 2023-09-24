"use server"
import rakun from "@/lib/rakun"
import { Settings } from "@/atoms/settings"
import { AnilistShortMedia, AnilistShowcaseMedia } from "@/lib/anilist/fragment"
import { findBestCorrespondingMedia } from "@/lib/local-library/media-matching"
import { ScanLogging } from "@/lib/local-library/logs"
import { getDirectoryPath, removeTopPath, splitFolderPath } from "@/lib/helpers/path"
import { getLocalFileParsedEpisode, valueContainsNC, valueContainsSpecials } from "@/lib/local-library/utils"
import { useAniListAsyncQuery } from "@/hooks/graphql-server-helpers"
import { AnimeShortMediaByIdDocument } from "@/gql/graphql"
import { experimental_analyzeMediaTree } from "@/lib/anilist/actions"
import { LocalFile, LocalFileWithMedia } from "@/lib/local-library/types"

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
export const createLocalFile = async (
    settings: Settings,
    initialProps: Pick<LocalFile, "name" | "path">,
    _scanLogging: ScanLogging,
): Promise<LocalFile> => {

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
 * @description Purpose
 * - Takes a [LocalFile] and an array of [AnilistShortMedia] fetched from AniList.
 * - Compare [LocalFile] parsed info to all [AnilistShortMedia]s titles to get the best match.
 * - Returns [LocalFileWithMedia] which is a [LocalFile] with an [AnilistShortMedia] attached to it.
 * @description Use
 * - Use the returned [LocalFileWithMedia] to hydrate the [LocalFile]'s metadata before sending it to the client
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
        }
    }
    return undefined
}

/* -------------------------------------------------------------------------------------------------
 * Metadata
 * -----------------------------------------------------------------------------------------------*/

/**
 * @description Purpose
 * - Analyzes [LocalFile]'s parsed data, uses ratings to accept/reject the match
 * - Normalizes the episode number if it's absolute before hydrating metadata
 * @description Use
 * - Send the hydrated [LocalFile] to the client if there's no `error`
 */
export async function hydrateLocalFileWithInitialMetadata(props: {
    file: LocalFile,
    media: AnilistShowcaseMedia
    _mediaCache: Map<number, AnilistShortMedia>
    _aniZipCache: Map<number, AniZipData>
    _scanLogging: ScanLogging
}) {

    const { file: _originalFile, media, _mediaCache, _scanLogging, _aniZipCache } = props

    let file = structuredClone(_originalFile)
    let error = false

    _scanLogging.add(file.path, ">>> [local-file/hydrateLocalFileWithInitialMetadata]")
    _scanLogging.add(file.path, "Hydrating metadata")

    if (!valueContainsSpecials(file.name) && !valueContainsNC(file.name)) {

        if (media.format !== "MOVIE") {
            // Get the highest episode number
            const highestEp = media?.nextAiringEpisode?.episode || media?.episodes
            const episode = getLocalFileParsedEpisode(file.parsedInfo)

            // The parser got an absolute episode number, we will normalize it and give the file the correct media ID
            if (!!highestEp && !!episode && episode > highestEp) {

                _scanLogging.add(file.path, "warning - Absolute episode number detected")

                // Fetch the same media but with all necessary info (relations prop) to find the relative episode
                let fetchedMedia: AnilistShortMedia | null | undefined

                _scanLogging.add(file.path, "   -> Analyzing media relations [AnimeShortMediaByIdDocument]")

                if (!_mediaCache.has(media.id) || !_mediaCache.get(media.id)?.relations) {
                    _scanLogging.add(file.path, "   -> Cache MISS - Querying media relations")
                    fetchedMedia = (await useAniListAsyncQuery(AnimeShortMediaByIdDocument, { id: media.id })).Media
                    if (fetchedMedia) _mediaCache.set(media.id, fetchedMedia)
                } else {
                    _scanLogging.add(file.path, "   -> Cache HIT - Related media retrieved")
                    fetchedMedia = _mediaCache.get(media.id)
                }

                _scanLogging.add(file.path, "   -> Analyzing media tree [experimental_analyzeMediaTree]")

                const { normalizeEpisode } = await experimental_analyzeMediaTree({ media: fetchedMedia!, _mediaCache: _mediaCache, _aniZipCache })
                _scanLogging.add(file.path, "   -> Retrieved media relation tree")
                const normalizedEpisode = normalizeEpisode(episode)

                if (normalizedEpisode) {
                    _scanLogging.add(file.path, `   -> Normalization mapped episode ${episode} to ${normalizedEpisode.relativeEpisode}`)
                    _scanLogging.add(file.path, `   -> Overriding Media ID ${media.id} to ${normalizedEpisode.media.id}`)
                    file.metadata.episode = normalizedEpisode.relativeEpisode
                    file.mediaId = normalizedEpisode.media.id
                } else {
                    _scanLogging.add(file.path, `   -> error - Could not normalize the episode number`)
                    error = true
                    _scanLogging.add(file.path, `   -> File will be un-matched`)
                    // file.metadata.episode = highestEp
                    // file.metadata.aniDBEpisodeNumber = String(highestEp)
                    // file.metadata.episode = episode
                    // file.metadata.aniDBEpisodeNumber = String(episode)
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
                        error = true
                        _scanLogging.add(file.path, `   -> error - Could not hydrate metadata`)
                        _scanLogging.add(file.path, `   -> File will be un-matched`)
                    }
                }
            }
        } else {

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
        }

    } else {
        if ((media.format === "MOVIE" && media.episodes === 1) || (!!media.episodes && media.episodes === 1)) {
            _scanLogging.add(file.path, "Hydrating movie metadata")
            _scanLogging.add(file.path, `   -> episode = 1`)
            _scanLogging.add(file.path, `   -> aniDBEpisodeNumber = 1`)
            file.metadata.episode = 1
            file.metadata.aniDBEpisodeNumber = "1"
        }
    }

    return { file, error }

}
