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
  version: '1.5.0:1',
  releaseNotes: {
    en_US:
      'Download World shows the full download link (no more assembling it from the Interfaces tab), and init ensures the download folders exist before the file server starts.',
    es_ES:
      'Descargar mundo muestra el enlace completo (sin montarlo desde Interfaces) e init garantiza las carpetas antes de arrancar el servidor de archivos.',
    de_DE:
      'Welt herunterladen zeigt den vollständigen Download-Link (kein Zusammensetzen über Interfaces nötig), und init stellt die Ordner vor dem Dateiserver-Start sicher.',
    pl_PL:
      'Pobierz świat pokazuje pełny link pobierania (bez składania go z Interfaces), a init zapewnia foldery przed startem serwera plików.',
    fr_FR:
      'Télécharger le monde affiche le lien complet (plus besoin de le composer depuis Interfaces), et init garantit les dossiers avant le serveur de fichiers.',
  },
  migrations: {
    // Kept for installs skipping 1.2.0:0 — covers any pre-1.2.0 layout.
    up: async () => {
      await migrateToNewLayout()
    },
    down: IMPOSSIBLE,
  },
})
