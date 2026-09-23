import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { logError } from '../errorHandler'

export const seedFiles = sdk.setupOnInit(async (effects) => {
  try {
    await storeJson.merge(effects, {})
    console.info('Successfully seeded store.json file')
  } catch (error) {
    logError('Failed to seed store.json file', error)
    throw error
  }
})
