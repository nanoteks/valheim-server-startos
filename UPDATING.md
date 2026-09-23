# Updating the upstream version

Upstream is the prebuilt Docker image `ghcr.io/community-valheim-tools/valheim-server`, pinned in `startos/manifest/index.ts` under `images.valheim-server.source.dockerTag` (previously `ghcr.io/teriyakidactyl/docker-valheim-server`, retired in package 1.2.0:0 — unmaintained since April 2025, pre-Valheim-1.0).

## Determining the upstream version

Check published tags and recent commits:

```bash
docker manifest inspect ghcr.io/community-valheim-tools/valheim-server:1.4.0 | jq -r '.manifests[].platform.architecture'
```

Upstream uses bare-semver image tags (`1.4.0`, no `v` prefix; see https://github.com/community-valheim-tools/valheim-server-docker). Prefer a dated semver tag when available and record the digest you tested (1.4.0 tested at index digest `sha256:f9d07d36449ec59c4f81908c49ad6000b1c61fc3f0876b78f2020ccde86b47f7`).

Upstream publishes **amd64 only** — the manifest declares `arch: ['x86_64']` alone. Do not re-add `aarch64` unless upstream ships arm64.

## Applying the bump

1. Edit `dockerTag` in `startos/manifest/index.ts`.
2. Rebuild (`make`) and install on a StartOS box; verify world load and client join.
3. If the image changed env vars or data paths (`/config`, `/opt/valheim`), update `startos/main.ts` and this file in the same change.
4. The image boots as root and chowns its own directories — no package chown oneshot. Its entrypoint ends in `tini`, so the daemon keeps `runAsInit: true`.
