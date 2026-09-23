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
  version: '1.5.0:0',
  releaseNotes: {
    en_US:
      'Download World saves the world as a ZIP served by a new World Downloads address (LAN, port 28763). Leaner backups (Steam cache excluded, old-layout restores migrate).',
    es_ES:
      'Descargar mundo guarda el mundo como ZIP servido por la nueva dirección Descargas de mundos (LAN, puerto 28763). Copias más ligeras (caché de Steam excluida, restauraciones antiguas migran).',
    de_DE:
      'Welt herunterladen speichert die Welt als ZIP unter der neuen Adresse Welt-Downloads (LAN, Port 28763). Schlankere Backups (Steam-Cache ausgeschlossen, alte Restores migrieren).',
    pl_PL:
      'Pobierz świat zapisuje świat jako ZIP pod nowym adresem Pobieranie światów (LAN, port 28763). Lżejsze kopie (pamięć podręczna Steam wykluczona, stare przywracania migrują).',
    fr_FR:
      'Télécharger le monde enregistre le monde comme ZIP servi par la nouvelle adresse Téléchargements de mondes (LAN, port 28763). Sauvegardes allégées (cache Steam exclu, anciennes restaurations migrent).',
  },
  migrations: {
    // Kept for installs skipping 1.2.0:0 — covers any pre-1.2.0 layout.
    up: async () => {
      await migrateToNewLayout()
    },
    down: IMPOSSIBLE,
  },
})
