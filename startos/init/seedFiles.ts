import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { logError } from '../errorHandler'
import { migrateToNewLayout } from '../versions/current'

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  try {
    await storeJson.merge(effects, {})
    console.info('Successfully seeded store.json file')
    if (kind === 'restore') {
      await migrateToNewLayout()
    }
  } catch (error) {
    logError('Failed to seed store.json file', error)
    throw error
  }
})
