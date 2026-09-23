import { sdk } from '../sdk'
import { configure } from './configure'
import { downloadWorld } from './downloadWorld'
import { uploadWorld } from './uploadWorld'

export const actions = sdk.Actions.of()
  .addAction(configure)
  .addAction(uploadWorld)
  .addAction(downloadWorld)
