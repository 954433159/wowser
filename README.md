# Wowser

[![Version](https://img.shields.io/npm/v/wowser.svg?style=flat)](https://www.npmjs.org/package/wowser)
[![Join Community](https://img.shields.io/badge/discord-join_community-blue.svg?style=flat)](https://discord.gg/DeVVKVg)
[![Build Status](https://github.com/954433159/wowser/actions/workflows/ci.yml/badge.svg)](https://github.com/954433159/wowser/actions/workflows/ci.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/wowserhq/wowser/badge.svg)](https://snyk.io/test/github/wowserhq/wowser)
[![Maintainability](https://api.codeclimate.com/v1/badges/863393c7addcb1cd7be7/maintainability)](https://codeclimate.com/github/wowserhq/wowser/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/863393c7addcb1cd7be7/test_coverage)](https://codeclimate.com/github/wowserhq/wowser/test_coverage)

World of Warcraft in the browser using JavaScript and WebGL.

Licensed under the [**MIT** license](LICENSE).

[![See Wowser tech demo](https://user-images.githubusercontent.com/378235/27762818-800fd91c-5e79-11e7-8301-733d736dd065.jpg)](https://www.youtube.com/watch?v=BrnbANSwC4I)

## Status

Wowser is in the process of being split up into (at minimum) the following parts:

- [Client](https://github.com/wowserhq/client/) (user interface loaded from XML/LUA)
- [Pipeline](https://github.com/wowserhq/pipeline) server (serves up resources from the official client)

This repository will in the future become an umbrella package.

## Background

Wowser is a proof-of-concept of getting a triple-A game to run in a webbrowser,
attempting to tackle a wide variety of challenges: data retrieval, socket
connections, cryptography, 3d graphics, binary data handling, background workers
and audio, to name a few.

## Features

Wowser is aiming to be both a low-level API as well as a graphical client,
interacting with a World of Warcraft server like an official client would.

**Note:** Only Wrath of the Lich King (3.3.5a) is currently supported. A copy of
the official client is required.

**Warning:** Do not attempt to use this client on official/retail servers as
your account may get banned.

At present, Wowser is capable of:

- Authenticating by username / password.
- Listing available realms.
- Connecting to a realm.
- Listing characters available on a realm.
- Joining the game world with a character.
- Logging game world packets, such as when a creature moves in the vicinity.

In addition, there's good progress on getting terrain and models rendered.

## Browser Support

Wowser is presumed to be working on any browser supporting [JavaScript's typed
arrays] and at the very least a binary version of the WebSocket protocol.

## Development

The Phase 1 modernized development workflow requires **Node.js 24 LTS** and
**npm 11 or newer**. It uses Vite and incremental TypeScript while intentionally
retaining React 0.14.3 and Three.js 0.77.0; renderer/runtime upgrades belong to
later modernization phases.

1. Clone the repository:

   ```shell
   git clone https://github.com/954433159/wowser.git
   cd wowser
   ```

2. Install dependencies from the lockfile:

   ```shell
   npm ci
   ```

3. Run the asset-free verification gates:

   ```shell
   npm test
   npm run typecheck
   npm run build
   ```

### Client

Start the Vite development server:

```shell
npm run dev
```

Vite serves the browser client on `http://localhost:5173` by default and proxies
`/pipeline` requests to `http://localhost:3000`.

### Pipeline server

To deliver game resources to its client, Wowser ships with a pipeline server.
The modernized server runs directly from source through `tsx`:

```shell
npm start
```

For automatic source reloads while developing the pipeline server:

```shell
npm run serve-dev
```

On first run you will be prompted to specify the following:

- Path to client data folder (e.g. `C:/Program Files (x86)/World of Warcraft/Data`)
- Server port (default is `3000`)
- Number of cluster workers (default depends on amount of CPUs)

Clear these settings by running:

```shell
npm run reset
```

The pipeline still requires native [StormLib] support and a legally obtained
World of Warcraft 3.3.5a client data directory. CI, unit tests, TypeScript source
validation, and the browser production build do **not** require proprietary WoW
assets or a live WoW server.

**Disclaimer:** Wowser serves up resources to the browser over HTTP. Depending
on your network configuration these may be available to others. Respect laws and
do not distribute game data you do not own.

### Socket proxies

To utilize raw TCP connections a WebSocket proxy is required for JavaScript
clients.

[Websockify] can - among other things - act as a proxy for raw TCP sockets.

For now, you will want to proxy both port 3724 (auth) and 8129 (world). Use a
different set of ports if the game server is on the same machine as your client.

```shell
npm run proxy 3724 host:3724
npm run proxy 8129 host:8129
```

## Contribution

When contributing, please:

- Fork the repository
- Open a pull request (preferably on a separate branch)

[BLPConverter]: https://github.com/wowserhq/blizzardry#blp
[JavaScript's typed arrays]: http://caniuse.com/#search=typed%20arrays
[Node.js]: http://nodejs.org/#download
[StormLib]: https://github.com/wowserhq/blizzardry#mpq
[Websockify]: https://github.com/kanaka/websockify/
