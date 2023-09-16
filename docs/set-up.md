# Set up

Seanime consists of a back-end Node.js server and a front-end Next.js web app.

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
