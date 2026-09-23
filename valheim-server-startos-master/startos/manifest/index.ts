import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'valheim-server',
  title: 'Valheim Server',
  license: 'MIT',
  packageRepo: 'https://github.com/nanoteks/valheim-server-startos',
  upstreamRepo: 'https://github.com/Teriyakidactyl/docker-valheim-server',
  marketingUrl: 'https://www.valheimgame.com',
  donationUrl: null,
  description: { short, long },
  volumes: ['main', 'startos'],
  images: {
    'valheim-server': {
      source: { dockerTag: 'ghcr.io/teriyakidactyl/docker-valheim-server:latest' },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {},
})
