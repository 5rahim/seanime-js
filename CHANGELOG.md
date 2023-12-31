# Changelog

All notable changes to this project will be documented in this file.

## 0.4.0

- ⬆️ Migrate to Next.js 14
    - Server actions are now stable
- 🏗️ Migrate to React Query v5
- ⬆️ Bump dependencies

## 0.3.10

- ⬆️ Update dependencies
- 🦺 Fixed bug reintroduction caused by logging

## 0.3.9

- ✨ Added ability to view episode info, including runtime, description...
- 🏗️ Refactored rejection logic to avoid unintentional rejections during scanning
- 🦺 Fixed Special episode detection in cases where episode number is higher than total episode count
- 🦺 Fixed matched files not being displayed in episode list when metadata is undefined
- 🩹 Updated M3U8 proxy

## 0.3.8

- 🚨 Fixed failing scan

## 0.3.7

- 💄 New Home Page design
- 🔄 Added loading overlay while scanning
- ⏪️ Disabled Anify as source for episode covers

## 0.3.6

- 🦺 Fixed incorrect completion status in episode list
- 🔄 Modified some aspects in logs
    - Directory path is now hidden
    - Dumped info logs are now in separate folder
    - Added more stats

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