import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.0.0:0',
  releaseNotes: {
    en_US: 'Initial Valheim release: dedicated server with Configure action and UDP 2456-2457',
    es_ES: 'Versión inicial de Valheim: servidor dedicado con acción Configurar y UDP 2456-2457',
    de_DE: 'Initiales Valheim-Release: Dedicated Server mit Konfigurieren-Aktion und UDP 2456-2457',
    pl_PL: 'Pierwsze wydanie Valheim: serwer dedykowany z akcją Konfiguruj i UDP 2456-2457',
    fr_FR: 'Version initiale Valheim : serveur dédié avec action Configurer et UDP 2456-2457',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
