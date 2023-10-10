<p align="center">
<img src="public/icons/android-chrome-512x512.png" alt="preview" width="75px"/>
</p>

<h2 align="center"><b>Seanime</b></h2>

<h4 align="center">User-friendly, self-hosted web app for managing your local library with AniList integration</h4>

<img src="docs/images/main_6.png" alt="preview" width="100%"/>

🚨 This project is a hobby, it's not meant to fix every shortcoming or include every requested feature. Some features
might not work as intended. Feel free to fork the project, contribute or open issues.

# Setup

[How to use Seanime.](https://seanime.rahim.app/getting-started)

# Features

## Local library

- [x] Scan local library and automatically match local files with corresponding
  anime.
  - [x] Scan with or without AniList anime list
    data.
  - [x] Support for various naming/folder
    structures.
  - [x] Support for absolute episode
    numbers.
  - [x] Support for movies.
  - [x] *Refresh entries*
    feature.
  - [x] Ignore files or folders
  - [x] Resolve unmatched files
  - [x] Update file metadata
    - [x] Episode number, AniDB episode number, Special/OVA or NC status
  - [x] Detailed logs for each scan
- [x] Resolve unmatched files
  - [x] Option to match single files or single folders to a suggested media
  - [x] Option to match files using AniList ID
- [x] Detect episodes missing from your local library
- [ ] Delete files

## Download

Powered by qBittorrent and Nyaa

- [x] qBittorrent support via Web API
- [x] In-app basic active torrent list
- [x] In-app embedded qBittorrent client
- [x] In-app torrent search via NYAA
  - [x] Automatic smart filters for search
- [x] Option to automatically select needed files in
  batches. [Learn more](https://github.com/5rahim/seanime/blob/main/docs/torrents.md#batches).

## Progress tracking

- [x] Open files with favorite player (VLC or MPC-HC)
- [x] Automatically track progress while watching with VLC or MPC-HC
- [x] Sync progress with AniList
- [ ] Sync progress with MAL

## AniList

- [x] Browse and manage your AniList anime list
  - [x] Browse your anime lists
  - [x] Add, edit AniList entries (status, score, progress…)
  - [x] Delete AniList entries (Planning list only)
- [x] See trending, popular shows, recent releases
- [x] Search and filter
  - [x] Advanced search (multiple filters)

## Streaming

- [x] Stream episodes from web sources
  - [x] Support for GogoAnime
  - [x] Support for Zoro (AniWatch)
- [x] Progress tracking
  - [x] Sync progress with AniList
  - [ ] Sync progress with MAL


## Disclaimer

[Read the disclaimer.](https://github.com/5rahim/seanime/blob/main/DISCLAIMER.md)

# Development

## Local development

1. Update `.env` file

2. Install packages

```shell
npm install
```

3. Run

```shell
npm run dev
```

## Build

```shell
npm run build
```

- Copy `.next/static` to `.next/standalone/.next/static`
- Copy `public` to `.next/standalone/public`

## Known issues

- Loading overlay may persist after scan is complete
- :shrug:

## Not planned

- Watch together feature / social features
- Torrent streaming
- MAL support
- Mobile app

## Future plans

- Manga support
- Desktop client
- Theming
- Plugins

## Contributing

Contributions are welcome, feel free to open issues or pull requests.

## Resources

Resources used to build Seanime.

- [React](https://react.dev/)
- [Next.js 13](https://nextjs.org/)
- [AniList](https://github.com/AniList/ApiV2-GraphQL-Docs)
- [Jotai](https://jotai.org/docs/recipes/large-objects) - State management library
- [Tailwind](https://tailwindcss.com/) - CSS framework
- [5rahim/chalk-ui](https://chalk.rahim.app/) - UI Components
- [rakun](https://github.com/lowlighter/rakun/) - Parser
- [nyaasi-api](https://github.com/ejnshtein/nyaasi-api) - Nyaa search API
- [@robertklep/qbittorrent](https://github.com/robertklep/qbittorrent) qBittorent API
- [MPC-HC API](https://github.com/rzcoder/mpc-hc-control) - MPC-HC API
- [VLC API](https://github.com/alexandrucancescu/node-vlc-client) - VLC API
- [GraphQL Codegen](https://the-guild.dev/graphql/codegen)

## Acknowledgements

- [Anikki](https://github.com/Kylart/Anikki/) - Inspired GraphQL fragments
- [Moopa](https://github.com/Ani-Moopa/Moopa) - Artplayer integration
- [Miru](https://github.com/ThaUnknown/miru) - Inspired some utility functions

# Screenshots

## Library

<img src="docs/images/img.png" alt="preview" width="100%"/>

## View

<img src="docs/images/img_12.png" alt="preview" width="100%"/>

## Discover

<img src="docs/images/img_11.png" alt="preview" width="100%"/>

## Schedule

<img src="docs/images/img_13.png" alt="preview" width="100%"/>

## Torrent search & download

<img src="docs/images/img_14.png" alt="preview" width="100%"/>

## Progress tracking

<img src="docs/images/img_16.png" alt="preview" width="100%"/>

## Streaming

<img src="docs/images/img_18.png" alt="preview" width="100%"/>
