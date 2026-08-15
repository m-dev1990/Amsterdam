import * as React from 'react'

export type tLanguageCodes = 'nl'|'en'

export type tGebouwYAML = {
  naam: string
  bijnaam: string|undefined
  groep: string|undefined
  wijk: string
  buurt: string|undefined
  eiland: string|undefined
  bouwjaar: number|undefined
  architect: string[]
  stijl: string|undefined
  interieur?: string[]
  functie: string[]
  hoogte?: number
  link?: {
    ['arcam.nl']?: string
    architect?: string[]
  }
}

export type tGebouw = tGebouwYAML & {
  tags: string[],
}

export type tFotoYAML = {
  bestand: string
  onderwerp: ({
    type: 'gebouw'|'persoon'|'world_press_photo_2025'|'poster'
    key: string
  }|{
    type: 'interieur'|'tentoonstelling'
    parent_key: string
    key: string
  }|{
    type: 'stadsdeel',
    key: string,
  })[]
}

export type tMuseumYAML = {
  naam: string
  tentoonstelling: tTentoonstellingYAML[]
}

export type tTentoonstellingYAML = {
  naam: string
}

export type tStadsdeelBranchYAML = {
  [naam: string]: tStadsdeelYAML[]
}

export type tStadsdeelYAML = tStadsdeelBranchYAML|string

export type tStadsdeelMob = {
  [string: string]: tStadsdeelMob | true
}

export const InformationText = {
  plain(string: string) {
    return {
      type: 'plain' as const,
      value: string
    }
  },
  translation(nl: string, en: string) {
    return {
      type: 'translation' as const,
      value: {
        nl: nl,
        en: en,
      },
    }
  }
}

export type tText = tTextPlain|tTextTranslated

export type tTextPlain = {
  type: 'plain'
  value: string
}

export type tTextTranslated = {
  type: 'translation'
  value: {
    en: string
    nl: string
  }
}

export type tInformationItemEntry = {
  type: 'line',
  label: tTextTranslated,
  values: (tTextPlain|tTextTranslated)[],
}

export type tInformationLineLink = {
  type: 'architect'|'arcam.nl'|'eye'|'world-press-photo-2025',
  url: string,
}

export type tInformationItemFull = {
  type: 'full',
  value: tText,
}

export type tInformation = {
  title: tTextPlain,
  lines: tInformationItemEntry[],
  extra: tInformationItemFull|undefined,
  web: tInformationLineLink[]
}

export type tFoto = tFotoYAML & {
  naam: string,
  tags: string[],
  information: tInformation[],
  url: {
    ['k']: tFotoURL,
    ['3k']: tFotoURL,
    ['4k']: tFotoURL,
    ['o']: tFotoURL,
  }|undefined
}

export type tFotoURL = {
  size: [number, number],
  url: string,
}

export type tFotoSizes = 'k'|'3k'|'4k'|'o'

export type tWorldPressPhoto2025YAML = {
  key: string,
  reeks: string,
  nummer: number|undefined,
  web: string,
  maker: string,
  comment: {
    nl: string,
    en: string,
  },
}

export type tEYEPosterYAML = {
  naam: string,
  film: {
    jaar: number,
    regisseur: string[],
    land: string[]
  },
  poster: {
    jaar: number,
    ontwerper: string[],
    land: string[]
  }
}

export type tActiviteit = string

export type tPlek = {
  type: 'rivier'|'straat'|'gracht',
  naam: string
}

export type tLandVertalingYAML = {
  [land_nl: string]: string,
}

export type tEYEPoster = tEYEPosterYAML
export type tWorldPressPhoto2025 = tWorldPressPhoto2025YAML

export type tTagType = 'stad'|'reis'|'dag'|'activiteit'|'gebouw'|'interieur'|'poster'|'persoon'|'world_press_photo_2025'
  |'groep'|'bijnaam'|'stadsdeel'|'wijk'|'buurt'|'rivier'|'gracht'|'straat'|'architect'|'decennium'|'eeuw'|'museum'|'tentoonstelling'|'voorwerp'|'stijl'|'functie'

export type tTagDef = {
  key: string,
  type: tTagType,
  name: string,
}

export type tSiteModel = {
  foto: tFoto[]
  gebouw: tGebouw[]
  eye_poster: tEYEPoster[]
  tag_map: Map<string, tTagDef>
  land_vertaling_map: { [key: string]: { nl: string, en: string } }
  world_press_photo_2025: tWorldPressPhoto2025YAML[]
}

export class AmsterdamError extends Error {
  parameters: any

  constructor(key: string, parameters: any) {
    super(key)
    this.parameters = parameters
  }

  static ref_empty<TP extends string, TV, T>(object: T, property_path: TP[], value: React.RefObject<TV>) {
    throw new AmsterdamError('no_ref', { ref: { object: object, property_path: property_path, value: value } })
  }
}