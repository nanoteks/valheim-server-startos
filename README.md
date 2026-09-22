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

- Image: `ghcr.io/teriyakidactyl/docker-valheim-server:latest`, architectures `x86_64`, `aarch64` (ARM via Box64).
- Entrypoint: upstream `tini` entrypoint via `sdk.useEntrypoint()` with `runAsInit: true` (tini must be PID 1).
- Subcontainers: `valheim-server-sub` runs daemon `valheim-server`.
- Env passed in `main.ts`: `SERVER_NAME`, `WORLD_NAME`, `SERVER_PASS`, `SERVER_PUBLIC` (`1`/`0`), `SERVER_PORT=2456`, `TZ=Etc/UTC`.

## Volume and Data Layout

- Volume `main`: persistent game data.
  - subpath `world` → `/world` (world saves, `WORLD_FILES`; permitted list).
  - subpath `app` → `/app` (SteamCMD server files, `APP_FILES`).
- Volume `startos` (unmounted): package state only, holds `store.json`. Backed up but never mounted into the container.

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
- Client connects via Steam Join IP `<host>:2456` + password.

## Actions

- `configure`: input form for serverName, worldName, serverPass, serverPublic. Prefill from `store.json` via `.once()`; handler `merge()`s back. `allowedStatuses: any`.

## Tasks

None.

## Health Checks

- Daemon `valheim-server` ready `Game Server`: `checkPortListening(2456)` — success when UDP/TCP 2456 bound, loading while SteamCMD downloads or server boots.

## Backups and Restore

- `sdk.Backups.ofVolumes('main', 'startos')`. Restore brings back worlds (`/world`), server files (`/app`), and settings. No re-registration needed.

## Limitations and Differences

- ARM64 runs x86 server binary under Box64; expect slower first boot.
- Password must be ≥5 characters (Valheim-enforced).
- No mods UI; `SERVER_ALLOW_LIST` not exposed (defaults allow-all).
- `latest` tag floats; pin digest or semver in manifest for releases.

---

## Quick Reference for AI Consumers

```yaml
package_id: 'valheim-server'
image:
  architectures: ['x86_64', 'aarch64']
  upstream: 'ghcr.io/teriyakidactyl/docker-valheim-server:latest'
subcontainers: ['valheim-server-sub']
volumes:
  main: { world: '/world', app: '/app' }
  startos: { store.json: 'serverName, worldName, serverPass, serverPublic' }
file_models: ['store.json']
startos_managed_env_vars: ['SERVER_NAME', 'WORLD_NAME', 'SERVER_PASS', 'SERVER_PUBLIC', 'SERVER_PORT', 'TZ']
dependencies: []
interfaces:
  game: { ports: '2456-2457', type: 'api', transport: 'TCP+UDP' }
actions: ['configure']
tasks: []
health_checks: ['Game Server: checkPortListening 2456']
```
