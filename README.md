<p align="center">
  <img src="icon.png" alt="Valheim Server Logo" width="21%">
</p>

# Valheim Server on StartOS

> Everything not listed in this document should behave the same as upstream Valheim Server.
> If a feature, setting, or behavior is not mentioned here, the upstream
> documentation is accurate and fully applicable — see the Documentation section of
> `instructions.md` for links.

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

## Image and Container Runtime

- Image: `ghcr.io/community-valheim-tools/valheim-server:1.4.0`, architecture `x86_64` only (upstream publishes no arm64 build; `aarch64` was dropped in 1.2.0:0).
- Entrypoint: upstream `bootstrap` ends in `exec tini -- supervisord`, run via `sdk.useEntrypoint()` with `runAsInit: true` (tini must be PID 1).
- Subcontainers: `valheim-server-sub` runs daemon `valheim-server`.
- Env passed in `main.ts`: `SERVER_NAME`, `WORLD_NAME`, `SERVER_PASS`, `SERVER_PUBLIC` (`1`/`0`, upstream also accepts `true`/`false`), `SERVER_PORT=2456`, `TZ=Etc/UTC`.
- The image boots as root and chowns `/config` + `/opt/valheim` to its service user itself — no package oneshot needed.

## Volume and Data Layout

- Volume `main`: persistent game data.
  - subpath `config` → `/config` (server config; worlds at `/config/worlds_local`, permitted list).
  - subpath `data` → `/opt/valheim` (SteamCMD server files + depot manifest cache, needed for updates).
- Volume `startos` (unmounted): package state only, holds `store.json`. Backed up but never mounted into the container.
- 1.2.0:0 migrated the Teriyakidactyl layout (`world/`, `app/`) to this one and removed the orphaned trees; see `startos/versions/current.ts`.

## File Models

- `store.json` (`startos` volume): `serverName` (default `MyValheimServer`), `worldName` (default `StartOS`), `serverPass` (min 5 chars, default `changeme123`), `serverPublic` (bool, default `false`). Seeded on init via `merge({})`; read reactively in `main.ts` so Configure restarts the daemon.

## Dependencies

None.

## Network Access and Interfaces

- Host `game` binds port range 2456-2457 (2 ports, TCP+UDP) via `bindPortRange`. Valheim uses UDP 2456-2457.
- Range interface `game`, type `api`, named Game Server. User enables LAN/WAN per address in Interfaces tab; WAN requires router UDP 2456-2457 forwarding. No Tor/clearnet claims.
- No web UI.

## Installation and First-Run Flow

- Install seeds `store.json` defaults. First start downloads/validates server via SteamCMD (5-10 min).
- User runs `Configure` action to set name/world/password/visibility; daemon restarts on change.
- User runs `Upload World` with the HTTP(S) URL of a ZIP holding one complete world: either a current-format world folder (`.db2`, `.fwl2`, `.chunk` files) or legacy world files (`.db` + `.fwl` pair, converted by the server on load). Downloaded (1 GB cap) and extracted into `main/config/worlds_local`, where the server reads worlds.
- Client connects via Steam Join IP `<host>:2456` + password.

## Actions

- `configure`: input form for serverName, worldName, serverPass, serverPublic. Prefill from `store.json` via `.once()`; handler `merge()`s back. `allowedStatuses: any`.
- `upload-world`: takes one `worldUrl` (`http(s)` URL of a `.zip` archive with one complete world: current-format folder or legacy `.db`+`.fwl` pair). Downloads with a 1 GB cap, then the same validation as ever: rejects unsafe paths, archives with no complete world, current-format files outside a world folder, and unmatched legacy halves. Extracts into `main/config/worlds_local`. File-picker inputs are deliberately not used — StartOS does not stage action file uploads (the raw browser `File` arrives as `{}` and fails input validation).
- `download-world`: takes one `worldName` (prefilled from settings) and serves the world as a temporary LAN download link (10-minute TTL, closes after first download). Current-format worlds zip as `<name>/…`; legacy pairs zip as flat `<name>.db`+`<name>.fwl`. Returns the URL as a copyable result (plus QR). Anyone on the LAN can fetch while live.

## Tasks

None.

## Health Checks

- Daemon `valheim-server` ready `Game Server`: `checkPortListening(2456)` — success when UDP/TCP 2456 bound, loading while SteamCMD downloads or server boots.

## Backups and Restore

- `sdk.Backups.ofVolumes('main', 'startos')` with a backup-only rsync exclude of regenerable `data/` (Steam server files, redownloaded after restore). Restore brings back worlds (`/config/worlds_local`), config, and settings; the service re-downloads server files on first post-restore boot. Restoring a pre-1.2.0 backup also runs the layout migration via init (`restore` kind). No re-registration needed.

## Limitations and Differences

- x86_64 only; no aarch64 build (upstream publishes amd64 alone).
- Password must be ≥5 characters (Valheim-enforced).
- No mods UI (upstream supports BepInEx/ValheimPlus, not exposed here); `SERVER_ALLOW_LIST` not exposed (defaults allow-all).

---

## Quick Reference for AI Consumers

```yaml
package_id: 'valheim-server'
image:
  architectures: ['x86_64']
  upstream: 'ghcr.io/community-valheim-tools/valheim-server:1.4.0'
subcontainers: ['valheim-server-sub']
volumes:
  main: { config: '/config', data: '/opt/valheim' }
  startos: { store.json: 'serverName, worldName, serverPass, serverPublic' }
file_models: ['store.json']
startos_managed_env_vars: ['SERVER_NAME', 'WORLD_NAME', 'SERVER_PASS', 'SERVER_PUBLIC', 'SERVER_PORT', 'TZ']
dependencies: []
interfaces:
  game: { ports: '2456-2457', type: 'api', transport: 'TCP+UDP' }
actions: ['configure', 'upload-world', 'download-world']
tasks: []
health_checks: ['Game Server: checkPortListening 2456']
```
