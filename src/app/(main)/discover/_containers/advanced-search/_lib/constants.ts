import { MediaFormat } from "@/gql/graphql"

export const ADVANCED_SEARCH_MEDIA_GENRES = [
    "Action",
    "Adventure",
    "Comedy",
    "Drama",
    "Ecchi",
    "Fantasy",
    "Horror",
    "Mahou Shoujo",
    "Mecha",
    "Music",
    "Mystery",
    "Psychological",
    "Romance",
    "Sci-Fi",
    "Slice of Life",
    "Sports",
    "Supernatural",
    "Thriller",
]

export const ADVANCED_SEARCH_SEASONS = [
    "Winter",
    "Spring",
    "Summer",
    "Fall",
]

export const ADVANCED_SEARCH_FORMATS: { value: MediaFormat, label: string }[] = [
    { value: "TV", label: "TV" },
    { value: "MOVIE", label: "Movie" },
    { value: "ONA", label: "ONA" },
    { value: "OVA", label: "OVA" },
    { value: "TV_SHORT", label: "TV Short" },
    { value: "SPECIAL", label: "Special" },
]

export const ADVANCED_SEARCH_STATUS = [
    { value: "FINISHED", label: "Finished" },
    { value: "RELEASING", label: "Airing" },
    { value: "NOT_YET_RELEASED", label: "Upcoming" },
    { value: "HIATUS", label: "Hiatus" },
    { value: "CANCELLED", label: "Cancelled" },
]

export const ADVANCED_SEARCH_SORTING = [
    { value: "TRENDING_DESC", label: "Trending" },
    { value: "START_DATE_DESC", label: "Release date" },
    { value: "SCORE_DESC", label: "Highest score" },
    { value: "POPULARITY_DESC", label: "Most popular" },
    { value: "EPISODES_DESC", label: "Number of episodes" },
]
