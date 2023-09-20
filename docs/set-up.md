# Set up

Seanime consists of a back-end Node.js server and a front-end Next.js web app. Data is stored in your browser's local
storage.

## Prerequisites

- Have an AniList account with hydrated watch lists
- Have VLC or MPC-HC installed
- Have qBittorrent installed (for torrent download)

## Good to know

- Seanime doesn't collect your data, everything is stored in your browser's local storage
- Seanime doesn't modify nor delete any file, only reads them
- Seanime doesn't read anything outside your local library

## Step-by-step guide

### 1. Get Node.js and NPM

It's easy, just download a pre-built installer [for your platform.](https://nodejs.org/en/download) `v18.17+`

### 2. Get the files

- If you have Git, just clone the repository

```shell
git clone https://github.com/5rahim/seanime.git
```

- If you don't, download the source code and unzip the files

### 3. Update `.env`

Both Consumet and Anify are optional.

- You can omit Consumet if you do not plan to use the streaming feature.
- You can omit the Anify API key if you do not need better episode covers.

1. Rename `.env.example` to `.env`
2. Update variables

```dotenv
# Deploy your Consumet API https://github.com/consumet/api.consumet.org#vercel
CONSUMET_API_URL="https://consumet-api-example.vercel.app"
# Get an API Key https://docs.anify.tv/start#api-keys
ANIFY_API_KEY=""
```

### 4. Build

```shell
cd <path to seanime>
```

```shell
npm run init
```

This command will automatically build a production version of the app.

### 5. Run

```shell
npm run start
```

- Go to `http://127.0.0.1:43200`

### 6. Configuration

- [Update your settings.](https://github.com/5rahim/seanime/blob/main/docs/settings.md)

## Logs

The scan logs will be located under `<path to seanime>/.next/standalone/logs`
