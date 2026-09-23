export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Valheim Server!': 0,
  'Game Server': 1,
  'Server is running': 2,
  'Server is starting': 3,
  // interfaces.ts
  'Valheim UDP game ports': 4,
  // actions/configure.ts
  'Server Name': 5,
  'Name shown in the Steam server browser': 6,
  'World Name': 7,
  'World name stored under /config/worlds_local. Enter an existing world name or create a new one.': 8,
  'Server Password': 9,
  'Minimum 5 characters, required by Valheim': 10,
  'Public Server': 11,
  'List server in the public Steam browser': 12,
  Configure: 13,
  'Set server name, world, password, and visibility': 14,
  // actions/uploadWorld.ts
  'World ZIP URL': 15,
  'HTTP(S) URL of a ZIP with one complete world: a current-format world folder (.db2, .fwl2, .chunk files) or legacy world files (.db + .fwl pair). Serve it from your PC, e.g. http://192.168.1.10:8000/Fjordhome.zip': 16,
  'Upload World': 17,
  'Download a Valheim world ZIP archive from a URL into the server volume': 18,
  'Stop the server before replacing files for the active world': 19,
  // actions/downloadWorld.ts
  'Download World': 20,
  'Save a world folder as a ZIP served by the World Downloads address': 21,
  'Name of the world to download': 22,
  'World download ready': 23,
  'Copy the link or scan the QR to download the world ZIP': 24,
  'Anyone able to reach the World Downloads address can download the world': 25,
  // interfaces.ts + file server health check
  'World Downloads': 26,
  'Download world ZIP files over LAN': 27,
  'File server is running': 28,
  'File server is starting': 29,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
