import { execFile as execFileCallback } from 'node:child_process'
import { mkdir, rm } from 'node:fs/promises'
import { promisify } from 'node:util'
import { i18n } from '../i18n'
import { logError } from '../errorHandler'
import { sdk } from '../sdk'

const execFile = promisify(execFileCallback)
const { InputSpec, Value } = sdk

const WORLD_EXTENSIONS = new Set(['.db2', '.fwl2', '.chunk'])

export const inputSpec = InputSpec.of({
  worldZip: Value.file({
	name: i18n('World ZIP archive'),
	description: i18n(
	  'Upload a ZIP containing one complete Valheim world folder with .db2, .fwl2, and .chunk files',
	),
	extensions: ['zip'],
	required: true,
  }),
})

function isSafeArchivePath(entry: string): boolean {
  const normalized = entry.replace(/\\/g, '/')
  return (
	normalized.length > 0 &&
	!normalized.startsWith('/') &&
	!normalized.split('/').includes('..') &&
	!/^[A-Za-z]:/.test(normalized)
  )
}

function isWorldFile(entry: string): boolean {
  const lower = entry.toLowerCase()
  return [...WORLD_EXTENSIONS].some((extension) => lower.endsWith(extension))
}

async function listArchiveEntries(archivePath: string): Promise<string[]> {
  const { stdout } = await execFile('unzip', ['-Z1', archivePath])
  return stdout
	.split(/\r?\n/)
	.map((entry) => entry.trim())
	.filter(Boolean)
}

async function extractWorldArchive(
  archivePath: string,
  worldPath: string,
): Promise<number> {
  const entries = await listArchiveEntries(archivePath)

  if (entries.length === 0 || entries.some((entry) => !isSafeArchivePath(entry))) {
	throw new Error('The ZIP contains no files or an unsafe path')
  }

  const files = entries.filter((entry) => !entry.endsWith('/'))
  const worldFiles = files.filter(isWorldFile)
  const hasDatabase = worldFiles.some((entry) => entry.toLowerCase().endsWith('.db2'))
  const hasMetadata = worldFiles.some((entry) => entry.toLowerCase().endsWith('.fwl2'))
  const hasChunks = worldFiles.some((entry) => entry.toLowerCase().endsWith('.chunk'))

  if (!hasDatabase || !hasMetadata || !hasChunks) {
	throw new Error('The ZIP must contain at least one .db2, .fwl2, and .chunk file')
  }

  await mkdir(worldPath, { recursive: true })
  await execFile('unzip', ['-o', archivePath, '-d', worldPath])
  return worldFiles.length
}

export const uploadWorld = sdk.Action.withInput(
  'upload-world',
  {
	name: i18n('Upload World'),
	description: i18n(
	  'Upload a complete Valheim world ZIP archive to the server volume',
	),
	warning: i18n('Stop the server before replacing files for the active world'),
	allowedStatuses: 'any',
	group: null,
	visibility: 'enabled',
  },
  inputSpec,
  async () => ({}),
  async ({ input }) => {
	const archivePath = input.worldZip.path
	const worldPath = sdk.volumes.main.subpath('world')

	try {
	  const fileCount = await extractWorldArchive(archivePath, worldPath)
	  console.info(`Uploaded Valheim world archive with ${fileCount} world files`)
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
