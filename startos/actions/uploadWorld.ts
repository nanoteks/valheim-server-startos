import { unzipSync } from 'fflate'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { i18n } from '../i18n'
import { logError } from '../errorHandler'
import { sdk } from '../sdk'

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

export async function extractWorldArchive(
  archivePath: string,
  worldPath: string,
): Promise<{ kinds: WorldArchiveKind[]; fileCount: number }> {
  let contents: Record<string, Uint8Array>
  try {
    contents = unzipSync(await readFile(archivePath))
  } catch {
    throw new Error('The file is not a valid ZIP archive')
  }
  const entries = Object.keys(contents)

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

  for (const file of files) {
    const destination = join(worldPath, file)
    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, contents[file])
  }
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
    let archivePath: string | undefined
    let worldPath: string | undefined
    try {
      const staged = (input as { worldZip?: unknown } | null)?.worldZip as
        { path?: unknown } | undefined
      if (typeof staged?.path !== 'string' || staged.path.length === 0) {
        throw new Error('Upload input missing staged file path')
      }
      archivePath = staged.path
      worldPath = sdk.volumes.main.subpath('config/worlds_local')

      const stagedStat = await stat(archivePath).catch(() => null)
      if (stagedStat === null || !stagedStat.isFile()) {
        throw new Error(`Staged upload not found or not a file: ${archivePath}`)
      }

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
      if (archivePath !== undefined) {
        await rm(archivePath, { force: true }).catch((error) => {
          logError('Failed to remove temporary world archive', error, {
            archivePath,
          })
        })
      }
    }
  },
)
