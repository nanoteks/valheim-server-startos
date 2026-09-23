import { sdk } from './sdk'
import { logError } from './errorHandler'

export const { createBackup, restoreInit } = sdk.setupBackups(
  async ({ effects }) => {
    try {
      return sdk.Backups.ofVolumes('main', 'startos')
    } catch (error) {
      logError('Failed to setup backup volumes', error, {
        volumes: ['main', 'startos'],
      })
      throw error
    }
  },
)
