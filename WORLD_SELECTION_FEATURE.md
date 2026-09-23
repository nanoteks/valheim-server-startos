# World Selection Feature Documentation

## Overview

Two related changes make it easier to run an existing Valheim world instead of
always generating a new one: the `Configure` action guides the user toward
reusing a world name, and a new `Upload World` action imports a world from a
ZIP archive into the `main/world` volume.

Note: there is no automatic world discovery. No code lists the `/world`
directory and no world list is shown or logged. The user types (or reuses) the
world name in `Configure`.

## Changes Made

### Modified files

#### `startos/actions/configure.ts`

1. **Input spec updated**: the `worldName` field description now reads
   "World seed name stored under /world. Enter an existing world name or
   create a new one.", telling users an existing world's name is acceptable.

2. **Prefill callback hardened**: `storeJson.read().once()` is wrapped in
   try-catch. A read failure logs via `logError()` and falls back to the
   file-model defaults instead of failing the form.

3. **Handler improved**:
   - Trims whitespace from `worldName` and rejects an empty name.
   - `storeJson.merge()` is wrapped in try-catch: failures are logged with
     the server/world names as context and rethrown.
   - Logs the world the configuration was saved with.

#### `startos/actions/index.ts`

Registers the new `uploadWorld` action alongside `configure`.

### New files

#### `startos/actions/uploadWorld.ts`

`upload-world` action accepting one `.zip` file:

1. Parses the archive in-process with `fflate` (no `unzip` binary — the
   StartOS host doesn't ship one). An unreadable file is rejected as not a
   valid ZIP.
2. Rejects empty archives and unsafe paths (absolute paths, `..` segments,
   Windows drive prefixes, backslash tricks).
3. Accepts the archive if it holds at least one complete world:
   - current format: a single top-level world folder containing at least one
     `.db2`, one `.fwl2`, and one `.chunk`/`.chunks` file;
   - legacy format: a matched `.db` + `.fwl` pair with the same file name at
     the archive root (the server converts legacy worlds itself on load).
   Anything else is rejected with a specific error (flat current-format
   files, unmatched legacy halves, or no world at all).
4. Writes the files into `<main/world/worlds_local>` (created recursively) —
   `worlds_local` because the server runs with `-savedir /world` and reads
   worlds from `<savedir>/worlds_local` — and removes the temporary upload
   afterwards. Listing, validation, and extraction share one parse, so there
   is no check-then-act gap.

Metadata warns the user to stop the server before replacing the active
world's files. `allowedStatuses` stays `any` so worlds can also be staged
while the server runs; the warning is the guard.

## How It Works

### User flow

1. User runs Actions → `Upload World` and submits a ZIP containing one
   complete world folder (`.db2` + `.fwl2` + `.chunk`).
2. The action validates and extracts the archive into `main/world`.
3. User runs Actions → `Configure` and sets World Name to the uploaded
   world's name (the exact file base name).
4. The service restarts with `WORLD_NAME` pointing at the uploaded world.

### First installation

No worlds exist yet; the user accepts the default (`StartOS`) or types a new
name and the server generates it on boot.

### After backup restore

Restored worlds are already in the volume via backup/restore. The user types
the restored world's name in `Configure` — same step 3 above.

## File format reference

The server runs with `-savedir /world`, so worlds live under
`/world/worlds_local` (i.e. `main/world/worlds_local` on the volume):

- Current format (Valheim 1.0+): one folder per world containing `_main.N.db2`
  (world data), `_main.N.fwl2` (metadata: name, seed), `_main.N.chunks`
  (chunk index), and per-chunk `.chunk` files.
- Legacy format (pre-1.0): two flat files, `Name.db` (world data) + `Name.fwl`
  (metadata), which must travel as a pair. Valheim converts legacy saves
  itself on load — you do not edit files, and the originals are left in
  place next to the converted world.

## Logging output

When configuration is saved:

```
Successfully updated server configuration with world: MyWorld1
```

When a world archive is imported:

```
Uploaded Valheim world archive with <n> world files
```

## Future enhancements

1. **World discovery**: list `/world` at form-render time and log available
   names so users don't have to remember them.
2. **Dropdown UI**: a select input if the SDK supports it.
3. **World metadata**: show creation date/size for candidate worlds.
4. **Pre-extraction staging**: extract to a temp dir and move into place so a
   failed import can't leave a half-written active world.
5. **Old-format support**: accept `.db`/`.fwl` and convert or warn.

## Testing recommendations

### Fresh installation

- Install, run `Configure`, accept defaults. Server generates the world.

### World upload

- Upload a valid current-format ZIP (world folder) → files land in
  `main/world/worlds_local/<World>/`.
- Upload a legacy `.db`+`.fwl` ZIP → files land in `main/world/worlds_local/`
  and the server converts them on first load.
- Upload a ZIP with an unsafe path (`../`, absolute) → rejected, nothing written.
- Upload a ZIP missing part of the world (no `.chunk`, lone `.db`) → rejected
  with a message naming the missing half.
- Upload an empty/unreadable ZIP → rejected.

### World selection

- `Configure` with the uploaded world's exact base name → server boots it.
- `Configure` with a blank world name → rejected, config unchanged.

## Troubleshooting

### Server boots a fresh world instead of the upload

The world name must match the uploaded files' base name exactly. Check the
file names in `main/world` and re-run `Configure`.

### Upload rejected

Read the action result: unsafe paths and incomplete archives (missing any of
`.db2`/`.fwl2`/`.chunk`) are refused before anything is written.
