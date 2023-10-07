# Changelog

All notable changes to this project will be documented in this file.

## 0.3.5

- 🚨 Fixed failing build

## 0.3.4

- 🦺 Fixed directory selector returning only relative path
  - This caused issues when default save path on qBittorrent was not the same as local directory
- ✨ Ability to deselect torrents from episode list preview
- 🔄 Changed default download directory to be the same as local directory when downloading batches

## 0.3.3

- ✨ Added progress bar to anime list
- 🦺 Fixed minor episode list image appearance inconsistencies
- 🦺 Fixed *Continue watching* section showing undownloaded episode when refreshing AniList

## 0.3.2

- 🏗️ Refactored how episode numbers are handled
- 🏗️ Better handling of mismatched episode count between AniList and AniDB
- 🦺 Fixed handling of "Episode 0" across the app

## 0.3.1

- ⚡️ Optimized "Resolve unmatched" feature
- 🦺 Fixed detection of "Episode 0" being included by AniList
- ✨ Added image shimmer effect
- ➖ Remove React devtool script
- ⬆️ Bump Next.js to 13.5.4
- ⬆️ Update dependencies

## 0.3.0

- 🎉 Support for *Enhanced scanning* (without AniList anime list data)
- 🦺 Fixed episode normalization
- 🦺 Fixed metadata hydration
- 🦺 Fixed *Resolve unmatched* feature
- ⚡️ Secured AniList token
- 🏗️ Better support for special episodes
- 🦺 Fixed and improved torrent search
- ⚡️ Improved scanning performance
- ⚡️ Improved episode normalization performance
- ⚡️ Improved UI
- 🦺 Bug fixes

## 0.2.0

- 🦺 Fixed directory selection
- 🏗️ Support for UNIX path separator by default
- 🏗️ Addition of new experimental features
- ⚡️ Optimized scanning
- ⚡️ Improved parsing
- 🦺 Bug fixes

## 0.1.0

- 🎉 Experimental features
