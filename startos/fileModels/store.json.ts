import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const defaultServerName = 'MyValheimServer'
export const defaultWorldName = 'StartOS'
export const defaultServerPass = 'changeme123'
export const defaultServerPublic = false

const shape = z.object({
  serverName: z.string().min(1).catch(defaultServerName),
  worldName: z.string().min(1).catch(defaultWorldName),
  serverPass: z.string().min(5).catch(defaultServerPass),
  serverPublic: z.boolean().catch(defaultServerPublic),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'store.json' },
  shape,
)
