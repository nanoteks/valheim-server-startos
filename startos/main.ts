import { i18n } from './i18n'
import { sdk } from './sdk'
import { VALHEIM_PORT } from './utils'
import {
  defaultServerName,
  defaultServerPass,
  defaultWorldName,
  storeJson,
} from './fileModels/store.json'
import { logError, withErrorHandling } from './errorHandler'

export const main = sdk.setupMain(async ({ effects }) => {
  try {
    console.info(i18n('Starting Valheim Server!'))

    const serverName = await withErrorHandling(
      () => storeJson.read((s) => s.serverName).const(effects),
      'read server name',
      defaultServerName,
    )
    const worldName = await withErrorHandling(
      () => storeJson.read((s) => s.worldName).const(effects),
      'read world name',
      defaultWorldName,
    )
    const serverPass = await withErrorHandling(
      () => storeJson.read((s) => s.serverPass).const(effects),
      'read server password',
      defaultServerPass,
    )
    const serverPublic = await withErrorHandling(
      () => storeJson.read((s) => s.serverPublic).const(effects),
      'read server public setting',
      false,
    )

    const gameMounts = sdk.Mounts.of()
      .mountVolume({
        volumeId: 'main',
        subpath: 'config',
        mountpoint: '/config',
        readonly: false,
      })
      .mountVolume({
        volumeId: 'main',
        subpath: 'data',
        mountpoint: '/opt/valheim',
        readonly: false,
      })

    const downloadsMounts = sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: 'downloads',
      mountpoint: '/downloads',
      readonly: true,
    })

    return sdk.Daemons.of(effects)
      .addDaemon('valheim-server', {
        subcontainer: sdk.SubContainer.of(
          effects,
          { imageId: 'valheim-server' },
          gameMounts,
          'valheim-server-sub',
        ),
        exec: {
          command: sdk.useEntrypoint(),
          runAsInit: true,
          env: {
            SERVER_NAME: serverName ?? defaultServerName,
            WORLD_NAME: worldName ?? defaultWorldName,
            SERVER_PASS: serverPass ?? defaultServerPass,
            SERVER_PUBLIC: (serverPublic ?? false) ? '1' : '0',
            SERVER_PORT: String(VALHEIM_PORT),
            TZ: 'Etc/UTC',
          },
        },
        ready: {
          display: i18n('Game Server'),
          fn: () =>
            sdk.healthCheck.checkPortListening(effects, VALHEIM_PORT, {
              successMessage: i18n('Server is running'),
              errorMessage: i18n('Server is starting'),
            }),
        },
        requires: [],
      })
      .addDaemon('downloads', {
        subcontainer: sdk.SubContainer.of(
          effects,
          { imageId: 'downloads' },
          downloadsMounts,
          'downloads-sub',
        ),
        exec: {
          command: ['httpd', '-f', '-p', '8080', '-h', '/downloads'],
        },
        ready: {
          display: i18n('World Downloads'),
          fn: () =>
            sdk.healthCheck.checkPortListening(effects, 8080, {
              successMessage: i18n('File server is running'),
              errorMessage: i18n('File server is starting'),
            }),
        },
        requires: [],
      })
  } catch (error) {
    logError('Failed to setup main daemon', error)
    throw error
  }
})
