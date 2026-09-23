import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { zipSync } from 'fflate'
import { T } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { i18n } from '../i18n'
import { defaultWorldName, storeJson } from '../fileModels/store.json'
import { CURRENT_EXTENSIONS, LEGACY_EXTENSIONS } from './uploadWorld'
import { logError } from '../errorHandler'

const { InputSpec, Value } = sdk

export const MAX_KEPT_DOWNLOADS = 3

export const inputSpec = InputSpec.of({
  worldName: Value.text({
    name: i18n('World Name'),
    description: i18n('Name of the world to download'),
    required: true,
    default: defaultWorldName,
    minLength: 1,
    maxLength: 64,
    masked: false,
  }),
})

function extensionOfLower(fileName: string): string | null {
  const lower = fileName.toLowerCase()
  for (const extension of [...CURRENT_EXTENSIONS, ...LEGACY_EXTENSIONS]) {
    if (lower.endsWith(extension)) return extension
  }
  return null
}

export async function collectWorldFiles(
  worldsDir: string,
  worldName: string,
): Promise<{ archiveName: string; entries: Record<string, Uint8Array> }> {
  const folder = join(worldsDir, worldName)
  const folderStat = await stat(folder).catch(() => null)
  if (folderStat !== null && folderStat.isDirectory()) {
    const entries: Record<string, Uint8Array> = {}
    const walk = async (dir: string, prefix: string) => {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        const rel = `${prefix}/${entry.name}`
        if (entry.isDirectory()) {
          await walk(full, rel)
        } else if (entry.isFile() && extensionOfLower(entry.name) !== null) {
          entries[rel] = await readFile(full)
        }
      }
    }
    await walk(folder, worldName)
    if (Object.keys(entries).length === 0) {
      throw new Error(`No world files found in ${worldName}`)
    }
    return { archiveName: `${worldName}.zip`, entries }
  }

  const entries: Record<string, Uint8Array> = {}
  for (const extension of LEGACY_EXTENSIONS) {
    const file = join(worldsDir, `${worldName}${extension}`)
    const fileStat = await stat(file).catch(() => null)
    if (fileStat !== null && fileStat.isFile()) {
      entries[`${worldName}${extension}`] = await readFile(file)
    }
  }
  if (Object.keys(entries).length === 2) {
    return { archiveName: `${worldName}.zip`, entries }
  }
  throw new Error(
    `World ${worldName} not found: expected a ${worldName}/ folder or a ${worldName}.db + ${worldName}.fwl pair`,
  )
}

export async function pruneDownloads(
  downloadsDir: string,
  keep = MAX_KEPT_DOWNLOADS,
): Promise<void> {
  const entries = await readdir(downloadsDir).catch(() => [] as string[])
  const zips: { name: string; mtimeMs: number }[] = []
  for (const entry of entries) {
    if (!entry.toLowerCase().endsWith('.zip')) continue
    const full = join(downloadsDir, entry)
    const entryStat = await stat(full).catch(() => null)
    if (entryStat !== null && entryStat.isFile()) {
      zips.push({ name: entry, mtimeMs: entryStat.mtimeMs })
    }
  }
  zips.sort((a, b) => b.mtimeMs - a.mtimeMs)
  for (const stale of zips.slice(keep)) {
    await rm(join(downloadsDir, stale.name), { force: true }).catch((error) => {
      logError('Failed to prune old world download', error, {
        file: stale.name,
      })
    })
  }
}

export const downloadWorld = sdk.Action.withInput(
  'download-world',
  {
    name: i18n('Download World'),
    description: i18n(
      'Save a world folder as a ZIP served by the World Downloads address',
    ),
    warning: i18n(
      'Anyone able to reach the World Downloads address can download the world',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  inputSpec,
  async ({ effects }) => {
    const current = await storeJson.read().once()
    return { worldName: current?.worldName ?? defaultWorldName }
  },
  async ({ effects, input }) => {
    const worldName = (input.worldName ?? '').trim()
    if (!worldName) {
      throw new Error('World name cannot be empty')
    }
    try {
      const worldsDir = sdk.volumes.main.subpath('config/worlds_local')
      const downloadsDir = sdk.volumes.main.subpath('downloads')
      await mkdir(worldsDir, { recursive: true })
      await mkdir(downloadsDir, { recursive: true })
      const { archiveName, entries } = await collectWorldFiles(
        worldsDir,
        worldName,
      )
      await pruneDownloads(downloadsDir)
      await writeFile(
        join(downloadsDir, archiveName),
        zipSync(entries, { level: 6 }),
      )
      const url = await downloadUrl(effects, archiveName).catch((error) => {
        logError('Failed to resolve download URL', error, { archiveName })
        return null
      })
      console.info(
        `Prepared world download ${archiveName} (${url ?? 'no URL'})`,
      )
      return {
        version: '1',
        title: i18n('World download ready'),
        message: i18n('Copy the link or scan the QR to download the world ZIP'),
        result: {
          type: 'single',
          value: url ?? archiveName,
          copyable: true,
          qr: url !== null,
          masked: false,
        },
      }
    } catch (error) {
      logError('Failed to prepare world download', error, { worldName })
      throw error
    }
  },
)

async function downloadUrl(
  effects: T.Effects,
  archiveName: string,
): Promise<string | null> {
  const host = await sdk.host.getOwn(effects, 'downloads').once()
  const urls = host?.bindings?.[8080]?.interfaces?.[
    'downloads'
  ]?.addressInfo?.nonLocal
    ?.filter({ kind: 'ipv4' })
    ?.format() as string[] | undefined
  const base = urls?.[0]
  if (!base) return null
  return `${base.replace(/\/$/, '')}/${encodeURIComponent(archiveName)}`
}
