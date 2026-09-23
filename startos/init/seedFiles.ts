import { mkdir } from 'node:fs/promises'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { logError } from '../errorHandler'
import { migrateToNewLayout } from '../versions/current'

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  try {
    await storeJson.merge(effects, {})
    console.info('Successfully seeded store.json file')
    // Volume subpaths must exist before daemons mount them: the downloads
    // sidecar fails to start if its mount source is missing.
    await mkdir(sdk.volumes.main.subpath('downloads'), { recursive: true })
    await mkdir(sdk.volumes.main.subpath('config/worlds_local'), {
      recursive: true,
    })
    if (kind === 'restore') {
      await migrateToNewLayout()
    }
  } catch (error) {
    logError('Failed to seed store.json file', error)
    throw error
  }
})
