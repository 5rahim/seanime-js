export default {
    extension: [
        /(?<mkv>[.]mkv$)/,
        /(?<mkv>MKV)/,
        /(?<mp4>[.]mp4$)/,
        /(?<mp4>MP4)/,
        /(?<_7z>[.]7z$)/,
    ],
    hash: [
        /[\[\()](?<hash>[A-F0-9]{8})[\]\)]/,
    ],
}
