<h2 align="center"><b>Seanime</b></h2>

<h4 align="center">Scan your local library, keep track of progress with AniList integration. Download new episodes or
batches.</h4>

![img_2.png](docs/img_2.png)

``
Windows, Tauri, Typescript, Next.js 13, Jotai, AniList API, Chalk UI Components
``

This project is a hobby and is not being made to solve every single edge case.

Like the design? [Chalk UI](https://github.com/5rahim/chalk-ui)

## Why?

![img_1.png](docs/img_1.png)

## Features

- [x] Connect to AniList
- [x] Scan local library and match local files with corresponding
  anime. [See classification guide](https://github.com/5rahim/seanime/blob/main/guide.md).
  - [x] Scan logs system
  - [x] .unsea/.seaignore file support to ignore a folder
  - [ ] File name tag system for faster matching (eg: {id-0001})
- [x] Show anime list from local library
- [x] Refresh/Re-scan library
- [x] Open episode with default player
- [x] Automatic progress tracking
  - [x] Sync progress with AniList
  - [ ] Sync progress with MAL
- [x] Lock/Unlock individual files to speed up scanning
- [x] Ignore files
  - [ ] Manage/Un-ignore ignored files
- [x] Un-match files (that might be incorrectly matched)
- [x] "Resolve unmatched" files features
  - [x] Match single files or folders to a media
  - [x] Option to match files using MAL ID
  - [ ] Show AniList link using AniZip
- [x] Download additional episodes using qBittorent (embedded) and Nyaa (search)
- [x] Show additional info like future airing episodes and sequels
- [ ] Stream episode from web source with custom player
- [x] Browse and manage AniList entries
- [ ] Search new anime

## Try it

```shell
npm install
```

```shell
npm run tauri:dev
```

## Known issues

- :shrug:

## TODO

- [ ] Edit file metadata
- [ ] Show a section with new, un-downloaded episodes
- [ ] Preliminary scan to hydrate AniList (for users without anilist data)
- Video
