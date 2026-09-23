import { execFile as execFileCallback } from 'node:child_process'
import { mkdir, rm } from 'node:fs/promises'
import { promisify } from 'node:util'
import { i18n } from '../i18n'
import { logError } from '../errorHandler'
import { sdk } from '../sdk'

const execFile = promisify(execFileCallback)
const { InputSpec, Value } = sdk

const CURRENT_EXTENSIONS = new Set(['.db2', '.fwl2', '.chunk', '.chunks'])
const LEGACY_EXTENSIONS = new Set(['.db', '.fwl'])

export type WorldArchiveKind = 'current' | 'legacy'

export const inputSpec = InputSpec.of({
  worldZip: Value.file({
    name: i18n('World ZIP archive'),
    description: i18n(
      'Upload a ZIP with one complete world: a current-format world folder (.db2, .fwl2, .chunk files) or legacy world files (.db + .fwl pair)',
    ),
    extensions: ['.zip'],
    required: true,
  }),
})

export function isSafeArchivePath(entry: string): boolean {
  const normalized = entry.replace(/\\/g, '/')
  return (
    normalized.length > 0 &&
    !normalized.startsWith('/') &&
    !normalized.split('/').includes('..') &&
    !/^[A-Za-z]:/.test(normalized)
  )
}

function extensionOf(fileName: string, extensions: Set<string>): string | null {
  const lower = fileName.toLowerCase()
  for (const extension of extensions) {
    if (lower.endsWith(extension)) return extension
  }
  return null
}

function isCurrentFormatFile(entry: string): boolean {
  return extensionOf(entry.split('/').pop() ?? '', CURRENT_EXTENSIONS) !== null
}

function topLevelDir(entry: string): string | null {
  const separator = entry.indexOf('/')
  return separator === -1 ? null : entry.slice(0, separator)
}

/**
 * Checks that the archive holds at least one complete world and reports
 * which formats were found. Throws a specific error otherwise.
 */
export function validateWorldArchive(entries: string[]): WorldArchiveKind[] {
  const files = entries.filter((entry) => !entry.endsWith('/'))

  const extensionsByFolder = new Map<string, Set<string>>()
  for (const file of files) {
    const folder = topLevelDir(file)
    const extension = extensionOf(file, CURRENT_EXTENSIONS)
    if (folder === null || extension === null) continue
    const seen = extensionsByFolder.get(folder) ?? new Set<string>()
    seen.add(extension)
    extensionsByFolder.set(folder, seen)
  }
  const hasCurrentFolder = [...extensionsByFolder.values()].some(
    (extensions) =>
      extensions.has('.db2') &&
      extensions.has('.fwl2') &&
      (extensions.has('.chunk') || extensions.has('.chunks')),
  )

  const rootFiles = files.filter((file) => topLevelDir(file) === null)
  const stripExtension = (file: string, extension: string) =>
    file.slice(0, -extension.length)
  const dbBases = new Set(
    rootFiles
      .filter((file) => extensionOf(file, LEGACY_EXTENSIONS) === '.db')
      .map((file) => stripExtension(file, '.db').toLowerCase()),
  )
  const fwlBases = new Set(
    rootFiles
      .filter((file) => extensionOf(file, LEGACY_EXTENSIONS) === '.fwl')
      .map((file) => stripExtension(file, '.fwl').toLowerCase()),
  )
  const hasLegacyPair = [...dbBases].some(
    (base) => base.length > 0 && fwlBases.has(base),
  )

  const kinds: WorldArchiveKind[] = []
  if (hasCurrentFolder) kinds.push('current')
  if (hasLegacyPair) kinds.push('legacy')
  if (kinds.length > 0) return kinds

  if (rootFiles.some(isCurrentFormatFile)) {
    throw new Error(
      'Current-format world files must be inside a single world folder named after the world, not at the archive root',
    )
  }
  const hasLegacyHalf = rootFiles.some(
    (file) => extensionOf(file, LEGACY_EXTENSIONS) !== null,
  )
  if (hasLegacyHalf) {
    throw new Error(
      'Legacy worlds need a matched .db + .fwl pair with the same file name (e.g. MyWorld.db + MyWorld.fwl)',
    )
  }
  throw new Error(
    'The ZIP contains no complete world: include a current-format world folder (.db2, .fwl2, .chunk files) or a legacy world (.db + .fwl pair with the same name)',
  )
}

async function listArchiveEntries(archivePath: string): Promise<string[]> {
  const { stdout } = await execFile('unzip', ['-Z1', archivePath]).catch(
    () => ({
      stdout: '',
    }),
  )
  return stdout
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export async function extractWorldArchive(
  archivePath: string,
  worldPath: string,
): Promise<{ kinds: WorldArchiveKind[]; fileCount: number }> {
  const entries = await listArchiveEntries(archivePath)

  if (
    entries.length === 0 ||
    entries.some((entry) => !isSafeArchivePath(entry))
  ) {
    throw new Error('The ZIP contains no files or an unsafe path')
  }

  const kinds = validateWorldArchive(entries)
  const files = entries.filter((entry) => !entry.endsWith('/'))
  const worldFiles = files.filter(
    (file) =>
      isCurrentFormatFile(file) ||
      extensionOf(file.split('/').pop() ?? '', LEGACY_EXTENSIONS) !== null,
  )

  await mkdir(worldPath, { recursive: true })
  await execFile('unzip', ['-o', archivePath, '-d', worldPath])
  return { kinds, fileCount: worldFiles.length }
}

export const uploadWorld = sdk.Action.withInput(
  'upload-world',
  {
    name: i18n('Upload World'),
    description: i18n(
      'Upload a complete Valheim world ZIP archive to the server volume',
    ),
    warning: i18n(
      'Stop the server before replacing files for the active world',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  inputSpec,
  async () => ({}),
  async ({ input }) => {
    const archivePath = input.worldZip.path
    const worldPath = sdk.volumes.main.subpath('world/worlds_local')

    try {
      const { kinds, fileCount } = await extractWorldArchive(
        archivePath,
        worldPath,
      )
      console.info(
        `Uploaded Valheim world archive (${kinds.join('+')} format) with ${fileCount} world files`,
      )
    } catch (error) {
      logError('Failed to upload Valheim world archive', error, {
        archivePath,
        destination: worldPath,
      })
      throw error
    } finally {
      await rm(archivePath, { force: true }).catch((error) => {
        logError('Failed to remove temporary world archive', error, {
          archivePath,
        })
      })
    }
  },
)
