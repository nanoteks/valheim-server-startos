import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.1.0:3',
  releaseNotes: {
    en_US:
      'Upload World now diagnoses staging problems instead of failing silently (staged file is verified before extraction)',
    es_ES:
      'Subir mundo ahora diagnostica problemas de carga en lugar de fallar en silencio (el archivo se verifica antes de extraer)',
    de_DE:
      'Welt hochladen meldet nun Upload-Probleme statt still zu scheitern (Datei wird vor dem Entpacken geprüft)',
    pl_PL:
      'Prześlij świat teraz zgłasza problemy z przesyłaniem zamiast cicho zawodzić (plik jest weryfikowany przed rozpakowaniem)',
    fr_FR:
      'Téléverser un monde signale désormais les problèmes de dépôt au lieu d’échouer en silence (fichier vérifié avant extraction)',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
