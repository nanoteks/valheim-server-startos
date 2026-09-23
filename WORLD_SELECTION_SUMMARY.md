# World Selection Feature - Implementation Summary

The `Configure` action now invites reusing an existing world name, and a new
`Upload World` action imports a current-format world ZIP into `main/config`.
There is no automatic discovery: no module lists the worlds directory, and no world list
is logged. The user types the world name in `Configure`.

## What was built

### 1. Upload World action (`startos/actions/uploadWorld.ts`) — NEW

- Accepts one `.zip` via `Value.file`.
- Rejects empty/unreadable archives and unsafe entry paths (absolute, `..`,
  drive prefixes).
- Accepts a current-format world folder (`.db2` + `.fwl2` + `.chunk`/`.chunks`
  sharing one top-level folder) and/or a legacy `.db` + `.fwl` pair with
  matching names (the server converts legacy worlds on load).
- Rejects flat current-format files and unmatched legacy halves with
  specific errors.
- Extracts into `sdk.volumes.main.subpath('world/worlds_local')` — the
  directory the server reads (`/config/worlds_local`) — then deletes the temp
  upload.
- Warns to stop the server before replacing the active world's files.

### 2. Enhanced Configure action (`startos/actions/configure.ts`) — MODIFIED

- `worldName` description points at reusing an existing world.
- Prefill falls back to file-model defaults if the store read fails.
- Handler trims `worldName`, rejects empty input, logs the saved world,
  and rethrows merge failures after logging.

## User experience

1. Actions → `Upload World` → submit the world ZIP.
2. Actions → `Configure` → set World Name to the uploaded world's base name.
3. Server restarts into that world.

## Files modified/created

```
startos/
├── actions/
│   ├── configure.ts (MODIFIED - hint text, validation, error handling)
│   ├── index.ts (MODIFIED - registers uploadWorld)
│   └── uploadWorld.ts (NEW - ZIP import action)
├── errorHandler.ts (EXISTING - used for error logging)
```

Documentation:

```
WORLD_SELECTION_FEATURE.md (REWRITTEN - matches merged code)
README.md (documents Upload World)
instructions.md (documents Upload World)
```

## Verification checklist

- `tsc --noEmit` clean (new i18n keys registered with translations).
- `s9pk pack` clean for both arches.
- `uploadWorld` validation + extraction exercised locally against real ZIPs
  (15 cases: current folder, legacy pair, mixed, unsafe, incomplete, flat,
  empty, junk) — all pass.
- Still to verify on a StartOS box: upload through the real action UI,
  server boot into uploaded current-format and converted legacy worlds,
  backup/restore round-trip.

## Related documentation

- `WORLD_SELECTION_FEATURE.md` — detailed feature documentation
- `ERROR_HANDLING_IMPLEMENTATION.md` — error handling details
- `README.md` — overall package documentation

---

**Status**: Implemented, typechecks, packs. Box verification pending.
