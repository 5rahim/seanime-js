# Guide

## Unmatched files

When some episode files are unmatched it generally means that:

- You did not have that anime in your AniList lists.
  - Seanime uses your AniList data to match episode files
  - It is recommended that you do not use the `Unresolved files` features but instead manually add the anime to AniList
    and `Refreshing entries`
- The naming is inconsistent across episode folders.
  - During the matching process, Seanime will not resolve files that have a folder name too dissimilar to the actual
    Anime.
- Movies may be matched incorrectly if they are not in separate folders.

```text
├── Library folder
    ├── Jujutsu Kaisen
        ├── Season 1
        │   └── ...
        ├── Season 2
        │   └── ...
        └── NC
            └── Jujustu Kaisen S1 OP.mkv        <- This will not be matched
            
--> Use the `Unresolved files` feature
```

```text
├── Library folder
    ├── Jujutsu Kaisen
        ├── Season 1
        │   └── ...
        ├── Season 2
        │   └── ...
        └── Movie
            └── Jujustu Kaisen 0.mkv            <- This MIGHT NOT be matched
            
--> Move it \/

├── Library folder
    ├── Jujutsu Kaisen
    │   ├── Season 1
    │   │   └── ...
    │   └── Season 2
    │       └── ...
    └── Jujustu Kaisen 0
        └── Jujustu Kaisen 0.mkv                <- Good

```

### Unresolved files

This a feature that allows you to match **folder files** to specific anime that you choose directly from Seanime.
You should use it as the **LAST** resolve OR use it to match ED/OP/NC/Specials folders to an anime or ignore them.

It can be problematic because it doesn't support file-by-file matching, as explained above, it will match the **folder**
content to the chosen anime.
For exemple it prompt you to choose an anime for this folder:

```text
├── Library folder
    ├── Movie title.mkv
    └── Unrelated movie.mkv

Or

├── Library folder
    └── Movies
        ├── Movie title.mkv
        └── Unrelated.mkv
```

## Locking files

Locking files is a feature that is made to speed up future refreshing.

After your first scan of the local library you should lock files that were perfectly matched before refreshing.

## Refresh vs Re-scan

### When to refresh entries?

What happens when you refresh entries?

- Seanime will not try to re-match **locked** or **ignored** files, this will speed up the process.
- A cleanup process is started to remove non-existent files from entries.

### When to re-scan library?

Re-scanning the library will un-match locked files and re-scan ignored files.

- After manually re-organizing multiple files or folders
- After changing local library

## Structure

### Recommended structure

```text
├── Library folder
    └── Anime title
        └── Anime title Season 1
            └── Anime title - S01E05.mkv
```

#### With episode titles in file name

- When there is an episode title, make sure the episode number is enclosed with "-"
- And make sure the folder's name has the anime title

```text
├── Library folder
    └── Bungo Stray Dogs
        └── Bungo Stray Dogs 5
            ├── Bungo Stray Dogs 5 - E05.mkv
            ├── Bungo Stray Dogs 5 - S05E05 - Optional episode title.mkv
            └── ...
```

#### Without anime titles in file name

/!\ Make sure the parent folder has the Anime title if the files do not.

```text
├── Library folder
    └── Anime title
        └── Anime title Season 1
            └── Episode title - S01E05.mkv
```

### Finding a movie title

Make sure all movies are located at the root, in a separate folders with the same title.

```text
├── Library folder
    ├── Movie title
    │   └── Movie title.mkv
    └── Another movie
        └── Another movie.mkv
```

\/ This is bad because you will not be able to use the `Unresolved files` feature because they all share the same
folder.

```text
├── Library folder
    ├── Movie title.mkv
    └── Another movie.mkv
```

## Auto-matching

- Seanime will try to match files to an anime using parsed info from the file name and its parent folders.
- Parsed data include: the title, the season and the episode number.
- The parsing algorithm will try to find **candidate** titles from:
  - The file name (Can incorrectly use episode title if the formatting is weird)
  - The folder name
  - It will create candidate titles based on parsed title from folder+file name if they do no match
  - It will also create candidate title variations based on the parsed season.
  - If the file title is not included in the folder title

### TL;DR

2 parent folders

- `> Anime S1-3 > Anime S1 > Anime S1E1.mkv` -> BEST
- `> Anime S1-3 > Anime S1 > Anime E1.mkv` -> Good
- `> Anime S1-3 > Anime > Anime S1E1.mkv` -> Good
- `> Anime S1-3 > S1 > Anime S1E1.mkv` -> Good
- `> Anime S1-3 > S1 > Anime E1.mkv` -> Good

1 parent folder

- `> Anime S1 > Anime S1E1.mkv` -> BEST
- `> Anime S1 > Anime E1.mkv` -> Good
- `> Anime > Anime S1E1.mkv` -> Good
- `> S1 > Anime S1E1.mkv` -> Good
- `> S1 > Anime E1.mkv` -> Good
- `> Anime > E1.mkv` -> Good

With episode titles

- `> Anime S1 > Anime - E1 - Episode title.mkv` -> Good
- `> Anime S1 > Episode E1.mkv` -> Passable
- `> Anime S1 > Episode title - E1.mkv` -> BAD

Without seasons

- `> Anime > Anime E1.mkv` -> Good
- `> Anime > E1.mkv` -> Good

Root folder

- `> Anime title - E1 - Episode title.mkv` -> Passable
- `> Anime title - Episode title - E1.mkv` -> BAD

### Exemple

```text
├── Library folder
    └── Jujustu Kaisen S1-2
        └── Jujustu Kaisen Season 1             <- (1) Captures season \/
            └── Jujustu Kaisen S01E01.mkv       <- (2) Captures title (ignores season)
            
---> Will try [Jujustu Kaisen, Jujustu Kaisen Season 1, ...]
```

```text
├── Library folder
    └── Jujustu Kaisen S1-2
        └── Season 2                            <- (1) Captures season \/
            └── Jujustu Kaisen 01.mkv           <- (2) Captures title

---> Will try [Jujustu Kaisen Season 2, Jujustu Kaisen Part 2, ...]
```

```text
├── Library folder
    └── Jujustu Kaisen S1-2                     <- (1) Captures title (ignores range) \/
        └── Season 1                            <- (2) Captures season \/
            └── Jujustu Kaisen S01E01.mkv       <- (3) Captures title (ignores season)

---> Will try [Jujustu Kaisen, Jujustu Kaisen Season 1, ...]
```

```text
(No recommended)
├── Library folder           
    └── Jujustu Kaisen S02E01.mkv               <- Captures title and season
    
---> Will try [Jujustu Kaisen Season 2, ...]
```

### Edge cases

```text
├── Library folder           
    └── JJK                                     <- Captures "JJK" \/
        └── Jujustu Kaisen S01E01.mkv           <- Captures "Jujustu Kaisen" and season

---> Will try [JJK, Jujustu Kaisen, JJK Jujutsu Kaisen]
```

```text
├── Library folder                              
    └── Jujustu Kaisen S1-2
        └── JJK S2                              <- Captures "JJK", captures season \/
            └── Jujustu Kaisen S01E01.mkv       <- Captures "Jujustu Kaisen"

---> Will try [JJK Season 2, ..., Jujustu Kaisen Season 2, ..., JJK Jujutsu Kaisen Season 2, ...]
```

```text
├── Library folder                              
    └── Fruits Basket S1-3                      <- Captures title (ignores range)
        └── Fruits Basket S2                    <- Overrides previous title, captures season \/
            └── S2E1 - Episode title.mkv        <- Captures "Episode title"

---> Will try [Fruits Basket Season 2, ..., Episode title Season 2, ..., Fruits Basket Episode title Season 2, ...]
---> However, since the Folder's title is prioritized the episode title might not affect the matching process
```

## Finding a season

Seanime will first try to locate the season from the file name, then look for it in the parent folder.

```text
├── Library folder
    └── Anime title                             
        └── Anime title Season 1                <- Season ignored
            ├── Anime title S01E05.mkv          <- Season 1 found
            ├── Anime title 01x05.mkv           <- Season 1 found
            ├── Anime title S1_5.mkv            <- Season 1 found
            └── ...
```

```text
├── Library folder
    └── Anime title                             
        └── Anime title Season 1                <- (2) Season 1 found
            ├── Anime title E05.mkv             <- (1) No season found, go up /\
            └── ...
```

## Finding an episode number

Seanime will search the file title for the episode number

### Example (Episode 5)

```text
├── Library folder
│   ├── Jujutsu Kaisen
│   │   ├── Season 1
│   │   │   ├── Jujutsu Kaisen S01E05.mkv
│   │   │   ├── Jujutsu Kaisen E05.mkv
│   │   │   ├── Jujutsu Kaisen 05.mkv
│   │   │   ├── Jujutsu Kaisen 5.mkv.......................<- This will be IGNORED, rename to "05"
│   │   │   ├── Jujutsu Kaisen 05v2.mkv    
│   │   │   ├── Jujutsu Kaisen 5'.mkv  
│   │   │   ├── Jujutsu Kaisen 05'.mkv 
│   │   │   ├── Jujutsu Kaisen 05.2.mkv    
│   │   │   ├── Jujutsu Kaisen 01x05.mkv...................<- Equivalent to S01E05
│   │   │   ├── Jujutsu Kaisen 05x02.mkv...................<- This will return 2 - Avoid versioning with "x"
│   │   │   ├── Jujutsu Kaisen S1 - 5.mkv                  
│   │   │   ├── Jujutsu Kaisen S1_5.mkv                    
│   │   │   ├── Jujutsu Kaisen 5_2.mkv.....................<- This will return 2 - Avoid versioning with "_"
│   │   │   ├── Jujutsu Kaisen S1-5.mkv....................<- This will be IGNORED as it is considered as a range
│   │   │   ├── Jujutsu Kaisen 1-5.mkv.....................<- This will be IGNORED as it is considered as a range
│   │   │   ├── Jujutsu Kaisen 05 Episode title.mkv    
│   │   │   ├── Jujutsu Kaisen 2 - E05.mkv 
│   │   │   ├── Jujutsu Kaisen 2 - 05 Episode title.mkv   
 
│   │   │   ├── Jujutsu Kaisen 2 05 Episode title.mkv......<- This will be IGNORED
│   │   │   └── ...
│   │   └── ...
```

### Automatic Classification

As explained previously, Seanime will try to match your episode files to AniList entries using
multiple techniques.

You may discover that some episodes or seasons are not detected, if this is the case:

- Make sure that you added the season to your watch list
    - Seanime will try to match with sequels or prequels that are not on your watch list but may not find earlier or
      later seasons
    - For example, let's say your have the 1st, 2nd and 3rd Season in your files but only have the 1st season added in
      your watch list, Seanime will not be able to match to the 3rd season
- If you still don't see the episodes, rename their parent folder so that it accurately matches the title on AniList.
- Seanime may unmatch some episodes if it detects an anime title in the folder's name and that title differs too much
  from the actual anime.
