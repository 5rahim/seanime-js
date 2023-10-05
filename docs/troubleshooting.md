# Troubleshooting

## Bugs

### Some parts of the app are loading forever

- Make sure you have a stable internet connection.
- Close and reopen your browser, try using a different browser.
- Clear your browser's cache and cookies.
- Use task manager to close all instances of your browser, then reopen it.

### "Continue Watching", "Currently Watching" or other categories disappeared

- Refresh AniList.
- Log out and log back in.

## Scanning

### Scanning is taking too long

- Check the console for errors.
- If the console shows that the scan is complete, but the app is still loading, try refreshing the page and scanning
  again.
- If the scan is hanging on a specific part, you might have hit the API rate limit.

### Season mismatch

- Use enhanced scanning.
- Unmatch episodes and use the "Resolve unmatched" feature.

### Media mismatch

- Verify that the torrent filenames are parsable and adhere to the guidelines.

## Episodes

### Incorrect metadata / Episode covers

- This is most likely caused by a mismatch between the episode count in AniList and AniDB.
- Update the metadata. Seanime uses `AniDB Episode Number` as the source of truth for episode titles and covers.

### Incorrect missing episodes / undownloaded episodes detection

- This is most likely caused by a mismatch between the episode count in AniList and AniDB.
- Make sure that your file count corresponds to AniList's episode count.
