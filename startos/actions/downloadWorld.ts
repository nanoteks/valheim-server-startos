import { createServer, type Server } from 'node:http'
import { networkInterfaces } from 'node:os'
import { mkdir, readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { zipSync } from 'fflate'
import { sdk } from '../sdk'
import { i18n } from '../i18n'
import { defaultWorldName, storeJson } from '../fileModels/store.json'
import { CURRENT_EXTENSIONS, LEGACY_EXTENSIONS } from './uploadWorld'
import { logError } from '../errorHandler'

const { InputSpec, Value } = sdk

const LINK_PORT_START = 28763
const LINK_PORT_TRIES = 10
const LINK_TTL_MS = 10 * 60 * 1000

interface ActiveDownload {
  server: Server
  timer: NodeJS.Timeout
  url: string
}

let activeDownload: ActiveDownload | undefined

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

function lanAddress(): string {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address
      }
    }
  }
  throw new Error('No LAN address found on this server')
}

function closeActiveDownload(): void {
  if (activeDownload !== undefined) {
    clearTimeout(activeDownload.timer)
    activeDownload.server.close()
    activeDownload = undefined
  }
}

export const downloadWorld = sdk.Action.withInput(
  'download-world',
  {
    name: i18n('Download World'),
    description: i18n('Serve a world folder as a temporary download link'),
    warning: i18n(
      'Anyone on your LAN can download the world while the link is live',
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
  async ({ input }) => {
    const worldName = (input.worldName ?? '').trim()
    if (!worldName) {
      throw new Error('World name cannot be empty')
    }
    try {
      const worldsDir = sdk.volumes.main.subpath('config/worlds_local')
      await mkdir(worldsDir, { recursive: true })
      const { archiveName, entries } = await collectWorldFiles(
        worldsDir,
        worldName,
      )
      const payload = zipSync(entries, { level: 6 })
      const address = lanAddress()

      closeActiveDownload()
      let port = LINK_PORT_START
      let server: Server | undefined
      for (let attempt = 0; attempt < LINK_PORT_TRIES; attempt += 1) {
        const candidate = LINK_PORT_START + attempt
        try {
          server = await listenCandidate(candidate, payload, archiveName, () =>
            closeActiveDownload(),
          )
          port = candidate
          break
        } catch (error) {
          logError(`Download port ${candidate} unavailable`, error)
        }
      }
      if (server === undefined) {
        throw new Error('Could not open a download port')
      }
      const url = `http://${address}:${port}/${encodeURIComponent(archiveName)}`
      const timer = setTimeout(() => {
        closeActiveDownload()
        console.info('World download link expired')
      }, LINK_TTL_MS)
      activeDownload = { server, timer, url }
      console.info(`Serving world ${worldName} at ${url} for 10 minutes`)
      return {
        version: '1',
        title: i18n('World download ready'),
        message: i18n(
          'Open or copy the link within 10 minutes to download the world ZIP',
        ),
        result: {
          type: 'single',
          value: url,
          copyable: true,
          qr: true,
          masked: false,
        },
      }
    } catch (error) {
      logError('Failed to prepare world download', error, { worldName })
      throw error
    }
  },
)

export function listenCandidate(
  port: number,
  payload: Uint8Array,
  archiveName: string,
  onServed: () => void,
): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Length': payload.byteLength,
        'Content-Disposition': `attachment; filename="${archiveName}"`,
      })
      res.end(payload)
      console.info('World download served, closing link')
      onServed()
    })
    server.once('error', reject)
    server.listen(port, '0.0.0.0', () => {
      server.removeListener('error', reject)
      resolve(server)
    })
  })
}
