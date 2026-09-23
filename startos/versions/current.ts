import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.1.0:0',
  releaseNotes: {
    en_US: 'Valheim dedicated server with Configure and Upload World actions, UDP 2456-2457',
    es_ES: 'Servidor dedicado de Valheim con acciones Configurar y Subir mundo, UDP 2456-2457',
    de_DE: 'Valheim Dedicated Server mit Konfigurieren- und Welt-hochladen-Aktionen, UDP 2456-2457',
    pl_PL: 'Serwer dedykowany Valheim z akcjami Konfiguruj i Prześlij świat, UDP 2456-2457',
    fr_FR: 'Serveur dédié Valheim avec actions Configurer et Téléverser un monde, UDP 2456-2457',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
