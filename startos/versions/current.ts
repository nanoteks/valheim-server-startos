import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.1.0:1',
  releaseNotes: {
    en_US: 'Fixes Upload World rejecting every file (extension now `.zip`); accepts current-format world folders and legacy `.db`+`.fwl` pairs into UDP 2456-2457 server',
    es_ES: 'Corrige Subir mundo que rechazaba todos los archivos (extensión `.zip`); acepta carpetas de mundo actuales y pares `.db`+`.fwl` anteriores',
    de_DE: 'Behebt abgelehnte Dateien bei Welt hochladen (Endung `.zip`); akzeptiert aktuelle Weltordner und alte `.db`+`.fwl`-Paare',
    pl_PL: 'Naprawia Prześlij świat odrzucające każdy plik (rozszerzenie `.zip`); przyjmuje aktualne foldery światów i starsze pary `.db`+`.fwl`',
    fr_FR: 'Corrige Téléverser un monde qui rejetait tous les fichiers (extension `.zip`) ; accepte dossiers actuels et paires `.db`+`.fwl` précédentes',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
