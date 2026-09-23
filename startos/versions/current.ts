import { mkdir, readdir, rename, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { logError } from '../errorHandler'
import { sdk } from '../sdk'

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

/**
 * Moves 1.1.0:3-era data to the community-valheim-tools layout:
 * `main/world/worlds_local/*` -> `main/config/worlds_local/`, then removes
 * the orphaned `main/world` and `main/app` (Steam cache, redownloaded).
 */
export async function migrateToNewLayout(
  mainPath: string = sdk.volumes.main.path,
): Promise<void> {
  const oldWorlds = join(mainPath, 'world/worlds_local')
  const newWorlds = join(mainPath, 'config/worlds_local')

  if (await pathExists(oldWorlds)) {
    await mkdir(newWorlds, { recursive: true })
    const entries = await readdir(oldWorlds)
    const failures: string[] = []
    for (const entry of entries) {
      const from = join(oldWorlds, entry)
      const to = join(newWorlds, entry)
      if (await pathExists(to)) {
        console.warn(`World ${entry} already exists, leaving old copy in place`)
        continue
      }
      try {
        await rename(from, to)
        console.info(`Migrated world ${entry}`)
      } catch (error) {
        logError(`Failed to migrate world ${entry}`, error, {
          from,
          to,
        })
        failures.push(entry)
      }
    }
    if (failures.length > 0) {
      throw new Error(
        `Failed to migrate worlds: ${failures.join(', ')}. Old data left in place.`,
      )
    }
    const remaining = await readdir(oldWorlds)
    if (remaining.length === 0) {
      await rm(join(mainPath, 'world'), { recursive: true, force: true })
      console.info('Removed orphaned world directory')
    } else {
      console.warn(
        `Leaving old world directory in place with unmigrated entries: ${remaining.join(', ')}`,
      )
    }
  }

  const appPath = join(mainPath, 'app')
  if (await pathExists(appPath)) {
    try {
      await rm(appPath, { recursive: true, force: true })
      console.info('Removed orphaned app directory')
    } catch (error) {
      logError('Failed to remove orphaned app directory', error, {
        appPath,
      })
    }
  }
}

export const current = VersionInfo.of({
  version: '1.3.0:0',
  releaseNotes: {
    en_US:
      'Upload World takes a ZIP URL instead of a file upload (StartOS does not stage action file inputs). Worlds still migrate from the old layout automatically.',
    es_ES:
      'Subir mundo acepta una URL del ZIP en lugar de subida de archivos (StartOS no transfiere archivos de acciones). Los mundos siguen migrando automáticamente.',
    de_DE:
      'Welt hochladen nimmt nun eine ZIP-URL statt eines Datei-Uploads (StartOS stellt Aktionsdateien nicht bereit). Welten migrieren weiterhin automatisch.',
    pl_PL:
      'Prześlij świat przyjmuje adres URL ZIP-a zamiast przesyłania pliku (StartOS nie przekazuje plików akcji). Światy nadal migrują automatycznie.',
    fr_FR:
      'Téléverser un monde prend une URL ZIP au lieu d’un envoi de fichier (StartOS ne transfère pas les fichiers d’actions). Les mondes migrent toujours automatiquement.',
  },
  migrations: {
    // Kept for installs skipping 1.2.0:0 — covers any pre-1.2.0 layout.
    up: async () => {
      await migrateToNewLayout()
    },
    down: IMPOSSIBLE,
  },
})
