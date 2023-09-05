<h2 align="center"><b>Seanime</b></h2>

<h4 align="center">Feature-packed, user-friendly app for managing your local library with AniList integration</h4>

<img src="docs/main.png" alt="preview" width="100%"/>

🚨 This project is a hobby and doesn't aim to solve every unique issue or address all complaints you may have about
similar software.

## Features

- [x] Scan local library and match local files with corresponding
  anime. [How it works](https://github.com/5rahim/seanime/blob/main/docs/guide.md#how-it-works).
  - [x] Support for various naming/folder
    structures. [Learn more](https://github.com/5rahim/seanime/blob/main/docs/guide.md#tldr).
  - [x] Support for absolute episode
    numbers. [Learn more](https://github.com/5rahim/seanime/blob/main/docs/guide.md#absolute-episode-number).
    - e.g., JJK 01 -> Season 1, JJK 29 -> Season 2
  - [x] Support for movies. [Learn more](https://github.com/5rahim/seanime/blob/main/docs/guide.md#finding-movie).
  - [x] Lock files to speed up subsequent
    scans. [Learn more](https://github.com/5rahim/seanime/blob/main/docs/guide.md#locking-files).
  - [x] Ignore files or folders
  - [x] Resolve unmatched files
  - [x] Unmatch files
  - [x] Logs
  - [ ] Filename tag system for faster matching
  - [ ] Update file metadata
- [x] Open files with VLC or MPC-HC
- [x] Automatic progress tracking
  - [x] Sync progress with AniList
  - [ ] Sync progress with MAL
- [x] Resolve unmatched files feature
  - [x] Match single files or folders to a media
  - [x] Option to match files using AniList ID
- [x] Download additional episodes using qBittorent (embedded) and Nyaa (search)
- [x] Browse and manage AniList entries
  - [x] Add, edit, AniList entries (status, score, progress…)
- [x] Stream episodes from web sources with custom player
  - [ ] Support for Crunchyroll
- [ ] See trending, search and filter
- [ ] Offline mode

<img src="docs/img_8.png" alt="preview" width="700"/>
<br/>
<img src="docs/img_9.png" alt="preview" width="700"/>

## Caveats

For the time being, users must ensure their AniList watchlist includes all media present in their local library before
initiating the scanning process.
This is because Seanime relies on the user's AniList data to accurately match episode files and organize them
effectively.
Failure to do so may result in incorrect matches, especially when dealing with sequels, prequels, or different seasons
of the same series.

## Development

1. Update `.env` file

```dotenv
# Deploy your Consumet API https://github.com/consumet/api.consumet.org#vercel
CONSUMET_API_URL="https://consumet-api-example.vercel.app"
```

2. Install packages

```shell
npm install
```

3. Enjoy

```shell
npm run dev
```

## Known issues

- :shrug:

## Not planned

- Watch together feature / social features
- Torrent streaming (use [Miru](https://github.com/ThaUnknown/miru/))
- Progress tracking without AniList
- Mobile app

## TODO

- [ ] Move Torrent Search to modal
- [ ] Edit file metadata
- [ ] Show a section with new, un-downloaded episodes
- [ ] Preliminary scan to hydrate AniList (for users without anilist data)
- [ ] Update settings local directory picker
- [ ] Manage/Un-ignore ignored files
- [ ] Optimize episode number normalization during scan with cache (library-entry.ts L171)
- [ ] Offline mode

## Resources

Resources used to build Seanime.

- [React](https://react.dev/)
- [Tauri](https://tauri.app/) - Like Electron.js but better
- [Next.js 13](https://nextjs.org/) - React framework + Server actions
- [AniList](https://github.com/AniList/ApiV2-GraphQL-Docs) - API upon which Seanime is built
- [Jotai](https://jotai.org/docs/recipes/large-objects) - State management library
- [Tailwind](https://tailwindcss.com/) - CSS framework built for scale
- [5rahim/chalk-ui](https://chalk.rahim.app/) - UI Components (shameless plug)
- [Consumet](https://github.com/consumet/api.consumet.org) - API for streaming sources
- [rakun](https://github.com/lowlighter/rakun/) - JS Parser for folder and file names
- [nyaasi-api](https://github.com/ejnshtein/nyaasi-api) - Nyaa search API
- [@ctrl/qbittorrent](https://www.npmjs.com/package/@ctrl/qbittorren) - qBittorent API NPM package
- [MPC-HC API](https://github.com/rzcoder/mpc-hc-control) - Original MPC-HC API code
- [VLC API](https://github.com/alexandrucancescu/node-vlc-client) - Original VLC API code
- [GraphQL Codegen](https://the-guild.dev/graphql/codegen) - GraphQL code generation
- [Moopa](https://github.com/Ani-Moopa/Moopa) - Video streaming Proxy (Temporary)

## Credit

- [Anikki](https://github.com/Kylart/Anikki/) - Inspired some GraphQL fragments and nomenclatures
- [Miru](https://github.com/ThaUnknown/miru/) - Inspired some AniList utility functions
- [Moopa](https://github.com/Ani-Moopa/Moopa) - Artplayer integration code
