## Features

- [x] Connect to AniList
- [ ] Sync progress with AniList
- [ ] Sync progress with MAL
- [ ] Browse and manage local library with Anilist information
  - [x] Automatically classify local files by
    anime. [See classification guide](https://github.com/5rahim/seanime/blob/main/guide.md).
  - [x] Show anime from local library
  - [ ] Navigate, open, set episode as watched
  - [ ] Download additional episodes using qBittorent and Nyaa
  - [ ] Show additional info like future airing episodes and sequels
- [x] Browse and manage AniList list
  - View AniList lists
  - Change score, update status, remove
- [ ] Show airing schedule for anime in local library
- [ ] Search new anime to add in local library

## TODO

- Lock/Unlock individual files
- Un-match files
- Add option to re-scan library (this will not keep previously locked/ignored files)
  - Call `retrieveLocalFilesAsLibraryEntries` without locked and ignored file arrays
  - Useful when user

## Known issues

- Delete entries, local files with no match when user changes Library directory
- Mutation to add new entry doesn't work
