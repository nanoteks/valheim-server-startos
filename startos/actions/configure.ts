import { sdk } from '../sdk'
import { i18n } from '../i18n'
import {
  defaultServerName,
  defaultServerPass,
  defaultWorldName,
  storeJson,
} from '../fileModels/store.json'
import { logError } from '../errorHandler'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  serverName: Value.text({
    name: i18n('Server Name'),
    description: i18n('Name shown in the Steam server browser'),
    required: true,
    default: defaultServerName,
    minLength: 1,
    maxLength: 64,
    masked: false,
  }),
  worldName: Value.text({
    name: i18n('World Name'),
    description: i18n(
      'World name stored under /config/worlds_local. Enter an existing world name or create a new one.',
    ),
    required: true,
    default: defaultWorldName,
    minLength: 1,
    maxLength: 64,
    masked: false,
  }),
  serverPass: Value.text({
    name: i18n('Server Password'),
    description: i18n('Minimum 5 characters, required by Valheim'),
    required: true,
    default: defaultServerPass,
    minLength: 5,
    maxLength: 64,
    masked: true,
    generate: { charset: 'a-z,A-Z,0-9', len: 12 },
  }),
  serverPublic: Value.toggle({
    name: i18n('Public Server'),
    description: i18n('List server in the public Steam browser'),
    default: false,
  }),
})

export const configure = sdk.Action.withInput(
  'configure',
  {
    name: i18n('Configure'),
    description: i18n('Set server name, world, password, and visibility'),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  inputSpec,
  async ({ effects }) => {
    try {
      const current = await storeJson.read().once()

      return {
        serverName: current?.serverName ?? defaultServerName,
        worldName: current?.worldName ?? defaultWorldName,
        serverPass: current?.serverPass ?? defaultServerPass,
        serverPublic: current?.serverPublic ?? false,
      }
    } catch (error) {
      logError('Failed to read configuration', error)
      console.warn('Using default configuration values')
      return {
        serverName: defaultServerName,
        worldName: defaultWorldName,
        serverPass: defaultServerPass,
        serverPublic: false,
      }
    }
  },
  async ({ effects, input }) => {
    try {
      // Validate world name is not empty
      const worldName = (input.worldName ?? '').trim()
      if (!worldName) {
        throw new Error('World name cannot be empty')
      }

      await storeJson.merge(effects, {
        serverName: input.serverName,
        worldName: worldName,
        serverPass: input.serverPass,
        serverPublic: input.serverPublic ?? false,
      })
      console.info(
        `Successfully updated server configuration with world: ${worldName}`,
      )
    } catch (error) {
      logError('Failed to save configuration', error, {
        serverName: input.serverName,
        worldName: input.worldName,
      })
      throw error
    }
  },
)
