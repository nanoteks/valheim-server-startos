import { i18n } from './i18n'
import { sdk } from './sdk'
import { VALHEIM_PORT } from './utils'
import { storeJson } from './fileModels/store.json'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Valheim Server!'))

  const serverName = await storeJson.read((s) => s.serverName).const(effects)
  const worldName = await storeJson.read((s) => s.worldName).const(effects)
  const serverPass = await storeJson.read((s) => s.serverPass).const(effects)
  const serverPublic = await storeJson.read((s) => s.serverPublic).const(effects)

  const mounts = sdk
    .Mounts.of()
    .mountVolume({
      volumeId: 'main',
      subpath: 'world',
      mountpoint: '/world',
      readonly: false,
    })
    .mountVolume({
      volumeId: 'main',
      subpath: 'app',
      mountpoint: '/app',
      readonly: false,
    })

  return sdk.Daemons.of(effects).addDaemon('valheim-server', {
    subcontainer: sdk.SubContainer.of(
      effects,
      { imageId: 'valheim-server' },
      mounts,
      'valheim-server-sub',
    ),
    exec: {
      command: sdk.useEntrypoint(),
      runAsInit: true,
      env: {
        SERVER_NAME: serverName ?? 'MyValheimServer',
        WORLD_NAME: worldName ?? 'StartOS',
        SERVER_PASS: serverPass ?? 'changeme123',
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
})
