import { sdk } from './sdk'
import { i18n } from './i18n'
import { VALHEIM_PORT } from './utils'

export const DOWNLOADS_PORT = 8080
export const DOWNLOADS_EXTERNAL_PORT = 28763

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const game = sdk.MultiHost.of(effects, 'game')
  const range = await game.bindPortRange({
    internalStartPort: VALHEIM_PORT,
    externalStartPort: VALHEIM_PORT,
    numberOfPorts: 2,
  })

  await range.export(
    sdk.createRangeInterface(effects, {
      id: 'game',
      name: i18n('Game Server'),
      description: i18n('Valheim UDP game ports'),
    }),
  )

  const downloads = sdk.MultiHost.of(effects, 'downloads')
  const origin = await downloads.bindPort(DOWNLOADS_PORT, {
    protocol: 'http',
    preferredExternalPort: DOWNLOADS_EXTERNAL_PORT,
  })

  await origin.export([
    sdk.createInterface(effects, {
      id: 'downloads',
      name: i18n('World Downloads'),
      description: i18n('Download world ZIP files over LAN'),
      type: 'api',
      masked: false,
      schemeOverride: null,
      username: null,
      path: '',
      query: {},
    }),
  ])
  return []
})
