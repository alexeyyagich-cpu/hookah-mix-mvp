import type { Locale } from '../types'

import { common as ruCommon } from './ru/common'
import { nav as ruNav } from './ru/nav'
import { auth as ruAuth } from './ru/auth'
import { settings as ruSettings } from './ru/settings'
import { hookah as ruHookah } from './ru/hookah'
import { bar as ruBar } from './ru/bar'
import { manage as ruManage } from './ru/manage'
import { market as ruMarket } from './ru/market'

import { common as enCommon } from './en/common'
import { nav as enNav } from './en/nav'
import { auth as enAuth } from './en/auth'
import { settings as enSettings } from './en/settings'
import { hookah as enHookah } from './en/hookah'
import { bar as enBar } from './en/bar'
import { manage as enManage } from './en/manage'
import { market as enMarket } from './en/market'

import { common as deCommon } from './de/common'
import { nav as deNav } from './de/nav'
import { auth as deAuth } from './de/auth'
import { settings as deSettings } from './de/settings'
import { hookah as deHookah } from './de/hookah'
import { bar as deBar } from './de/bar'
import { manage as deManage } from './de/manage'
import { market as deMarket } from './de/market'

const ru = {
  common: ruCommon,
  nav: ruNav,
  auth: ruAuth,
  settings: ruSettings,
  hookah: ruHookah,
  bar: ruBar,
  manage: ruManage,
  market: ruMarket,
}

const en = {
  common: enCommon,
  nav: enNav,
  auth: enAuth,
  settings: enSettings,
  hookah: enHookah,
  bar: enBar,
  manage: enManage,
  market: enMarket,
}

const de = {
  common: deCommon,
  nav: deNav,
  auth: deAuth,
  settings: deSettings,
  hookah: deHookah,
  bar: deBar,
  manage: deManage,
  market: deMarket,
}

export const dictionaries: Record<Locale, typeof ru> = { ru, en, de }

export type Dictionary = typeof ru
export type Namespace = keyof Dictionary
