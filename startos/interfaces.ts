import { sdk } from './sdk'
import { i18n } from './i18n'
import { VALHEIM_PORT } from './utils'

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
  return []
})
