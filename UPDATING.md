# Updating the upstream version

Upstream is the prebuilt Docker image `ghcr.io/teriyakidactyl/docker-valheim-server`, pinned in `startos/manifest/index.ts` under `images.valheim-server.source.dockerTag`.

## Determining the upstream version

Check published tags and recent commits:

```bash
docker manifest inspect ghcr.io/teriyakidactyl/docker-valheim-server:latest | jq -r '.manifests[].platform.architecture'
```

Upstream uses `latest` + `main` + semver/SHA tags (see https://github.com/Teriyakidactyl/docker-valheim-server). Prefer a dated semver tag when available; fall back to `latest` and record the digest you tested.

Confirm multi-arch (`amd64` + `arm64`) before pinning — StartOS ships `x86_64` and `aarch64`.

## Applying the bump

1. Edit `dockerTag` in `startos/manifest/index.ts`.
2. Rebuild (`make`) and install on a StartOS box; verify world load and client join.
3. If the image changed env vars or data paths (`/world`, `/app`), update `startos/main.ts` and this file in the same change.
