import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.1.0:2',
  releaseNotes: {
    en_US:
      'Fixes server crash-loop (volumes now chowned to the container user) and Upload World failing on the box (ZIP parsed in-process, no unzip binary needed)',
    es_ES:
      'Corrige el reinicio en bucle del servidor (volúmenes ahora del usuario del contenedor) y Subir mundo fallando en el servidor (ZIP procesado internamente, sin unzip)',
    de_DE:
      'Behebt Server-Neustartschleife (Volumes gehören nun dem Container-Nutzer) und fehlgeschlagene Welt-Uploads (ZIP wird intern verarbeitet, kein unzip nötig)',
    pl_PL:
      'Naprawia pętlę restartów serwera (wolumeny należą do użytkownika kontenera) i nieudane przesyłanie świata (ZIP przetwarzany wewnętrznie, bez unzip)',
    fr_FR:
      'Corrige la boucle de redémarrage du serveur (volumes attribués à l’utilisateur du conteneur) et l’échec de Téléverser un monde (ZIP traité en interne, sans unzip)',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
