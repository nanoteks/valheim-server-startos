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
  version: '1.3.0:1',
  releaseNotes: {
    en_US:
      'Instructions tab gains a step-by-step world-import guide (serve the ZIP over LAN with Python, paste its URL into Upload World).',
    es_ES:
      'La pestaña de instrucciones incluye una guía paso a paso para importar mundos (sirve el ZIP por LAN con Python y pega su URL en Subir mundo).',
    de_DE:
      'Der Anleitungs-Tab enthält nun eine Schritt-für-Schritt-Anleitung zum Importieren von Welten (ZIP per Python über LAN bereitstellen, URL bei Welt hochladen einfügen).',
    pl_PL:
      'Karta instrukcji zawiera przewodnik krok po kroku dotyczący importowania światów (udostępnij ZIP przez LAN Pythonem i wklej adres URL w Prześlij świat).',
    fr_FR:
      'L’onglet instructions inclut un guide pas à pas pour importer des mondes (sers le ZIP sur le LAN avec Python, colle son URL dans Téléverser un monde).',
  },
  migrations: {
    // Kept for installs skipping 1.2.0:0 — covers any pre-1.2.0 layout.
    up: async () => {
      await migrateToNewLayout()
    },
    down: IMPOSSIBLE,
  },
})
