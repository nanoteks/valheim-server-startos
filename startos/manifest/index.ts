import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'valheim-server',
  title: 'Valheim Server',
  license: 'MIT',
  packageRepo: 'https://github.com/nanoteks/valheim-server-startos',
  upstreamRepo: 'https://github.com/community-valheim-tools/valheim-server-docker',
  marketingUrl: 'https://www.valheimgame.com',
  donationUrl: null,
  description: { short, long },
  volumes: ['main', 'startos'],
  images: {
    'valheim-server': {
      source: {
        dockerTag:
          'ghcr.io/community-valheim-tools/valheim-server:1.4.0',
      },
      arch: ['x86_64'],
    },
  },
  dependencies: {},
})
