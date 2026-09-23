import { sdk } from '../sdk'
import { configure } from './configure'
import { uploadWorld } from './uploadWorld'

export const actions = sdk.Actions.of().addAction(configure).addAction(uploadWorld)
