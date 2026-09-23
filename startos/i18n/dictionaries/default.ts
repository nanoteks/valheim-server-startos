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
  'World name stored under /world/worlds_local. Enter an existing world name or create a new one.': 8,
  'Server Password': 9,
  'Minimum 5 characters, required by Valheim': 10,
  'Public Server': 11,
  'List server in the public Steam browser': 12,
  Configure: 13,
  'Set server name, world, password, and visibility': 14,
  // actions/uploadWorld.ts
  'World ZIP archive': 15,
  'Upload a ZIP with one complete world: a current-format world folder (.db2, .fwl2, .chunk files) or legacy world files (.db + .fwl pair)': 16,
  'Upload World': 17,
  'Upload a complete Valheim world ZIP archive to the server volume': 18,
  'Stop the server before replacing files for the active world': 19,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
