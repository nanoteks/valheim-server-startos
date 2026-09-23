# TODO — Valheim Server release checklist

## Identity & metadata

- [x] `startos/manifest/index.ts`: `packageRepo` (nanoteks/valheim-server-startos),
      `upstreamRepo` (community-valheim-tools/valheim-server-docker), `marketingUrl`, `donationUrl: null`,
      `license: MIT`.
- [x] `LICENSE`: real MIT text matching the manifest `license` field.
- [x] `startos/manifest/i18n.ts`: short/long descriptions, translated (es/de/pl/fr).
- [x] Icon: `icon.png` (256×256, 24 KiB, ≤ 40 KiB) downscaled from workspace `icon.png`.
      Note: official Valheim key art — fine for sideload, may need an original icon for marketplace.

## The service

- [x] Ids renamed: image `valheim-server`, volume `main` (+`startos`), daemon
      `valheim-server`, subcontainer `valheim-server-sub`. Consistent across manifest/main/backups.
- [x] Image: `ghcr.io/community-valheim-tools/valheim-server:1.4.0` (x86_64 only;
      upstream publishes no arm64),
      `sdk.useEntrypoint()` + `runAsInit: true` (entrypoint ends in tini, which must be PID 1).
      Tracked in `UPDATING.md`.
- [x] `startos/main.ts`: single daemon, `checkPortListening(2456)` health check, env from
      `store.json` (reactive). i18n keys pruned to referenced ones.
- [x] Interfaces: host `game`, `bindPortRange` 2456×2 (UDP 2456-2457), range interface `game`.
- [x] `startos/backups.ts`: `ofVolumes('main', 'startos')`.
- [x] `startos/dependencies.ts`: none confirmed.
- [x] `startos/actions/`: `configure` (serverName/worldName/serverPass/serverPublic),
-       `upload-world` (ZIP import from URL into `config/worlds_local`),
-       `download-world` (temporary LAN link for a world ZIP).
- [x] `startos/init/`: `seedFiles` merges `store.json` defaults.
- [x] `startos/versions/`: `1.5.0:1` with localized release notes and the 1.2.0:0 data migration
-       (kept: covers installs skipping 1.2.0:0), `down: IMPOSSIBLE`.

## Docs

- [x] `README.md` (no version numbers), `instructions.md`, `UPDATING.md`.
- [x] `AGENTS.md`: repo-specific bullets, no template filler.

## Build, test, ship

- [x] `make`: `tsc` clean, x86_64 packs.
- [ ] Sideload 1.5.0:1 on a StartOS box: Download World via the World Downloads interface address, Upload World via LAN URL, `Configure`,
      join via Steam `Join IP <host>:2456`, confirm health goes green.
- [ ] Backup / restore sanity check on the box.
- [ ] Re-read README/instructions against actual behavior after the box test.
- [ ] CI: `tagAndRelease.yml` + `release.yml` disabled (`*.disabled`) — they require
      Start9 org vars/secrets. Re-enable (rename back) before community-registry submission.
- [ ] Community registry: email submissions@start9.com with the repo link; Start9 forks to
      Start9-Community and reviews. Fork becomes upstream afterwards.
