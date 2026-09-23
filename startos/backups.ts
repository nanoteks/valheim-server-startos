import { sdk } from './sdk'
import { logError } from './errorHandler'

export const { createBackup, restoreInit } = sdk.setupBackups(
  async ({ effects }) => {
    try {
      // Steam server files (~2GB, redownloaded after restore) stay out of
      // backups; worlds, config, and settings are all included.
      return sdk.Backups.ofVolumes('main', 'startos').setBackupOptions({
        exclude: ['data'],
      })
    } catch (error) {
      logError('Failed to setup backup volumes', error, {
        volumes: ['main', 'startos'],
      })
      throw error
    }
  },
)
