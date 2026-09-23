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
  'World seed name stored under /world': 8,
  'Server Password': 9,
  'Minimum 5 characters, required by Valheim': 10,
  'Public Server': 11,
  'List server in the public Steam browser': 12,
  Configure: 13,
  'Set server name, world, password, and visibility': 14,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
