import * as Model from './Model.ts'

import gebouw_array_YAML from './information/gebouwen.yml'
import foto_array_YAML from './information/fotoos.yml'
import museum_array_YAML from './information/musea.yml'
import world_press_photo_array_YAML from './information/world-press-photo.yml'
import eye_poster_array_YAML from './information/posters.yml'
import land_mob_YAML from './information/landen.yml'
import stadsdeel_array_YAML from './information/stadsdelen.yml'
import plek_array_YAML from './information/plekken.yml'
import activiteit_array_YAML from './information/activiteiten.yml'
import vertalingen_mob_YAML from './information/vertalingen.yml'
import stijlen_mob_YAML from './information/stijlen.yml'

let FetchValidate = import.meta.env.DEV ? 
  await import('./FetchValidate.ts').then(x => x.default)
  : undefined

export function get() {
  function convert_null_to_undefined(x: any) {
    if (Array.isArray(x)) {
      for (let i = 0; i < x.length; ++i) {
        let value = x[i]
        if (value === null) {
          x[i] = undefined
        } else {
          convert_null_to_undefined(value)
        }
      }
    } else if (typeof x === 'object') {
      for (let key in x) {
        let value = x[key]
        if (value === null) {
          x[key] = undefined
        } else {
          convert_null_to_undefined(value)
        }
      }
    }
  }

  convert_null_to_undefined(gebouw_array_YAML)
  convert_null_to_undefined(world_press_photo_array_YAML)

  let data = {
    stadsdelen_array_YAML: stadsdeel_array_YAML,
    foto_array_YAML: foto_array_YAML,
    gebouw_array_YAML: gebouw_array_YAML,
    museum_array_YAML: museum_array_YAML,
    eye_posters_array_YAML: eye_poster_array_YAML,
    world_press_photo_2025_array_YAML: world_press_photo_array_YAML,
    activiteit_array_YAML: activiteit_array_YAML,
    plek_array_YAML: plek_array_YAML,
    landen_mob_YAML: land_mob_YAML,
    vertalingen_mob_YAML: vertalingen_mob_YAML,
    stijlen_mob_YAML: stijlen_mob_YAML,
  }
  
  FetchValidate?.call(undefined, data);

  return {
    stadsdeel: stadsdeel_array_YAML as Model.tStadsdeelYAML[],
    foto: foto_array_YAML as Model.tFotoYAML[],
    gebouw: gebouw_array_YAML as Model.tGebouwYAML[],
    museum: museum_array_YAML as Model.tMuseumYAML[],
    eye_poster: eye_poster_array_YAML as Model.tEYEPosterYAML[],
    world_press_photo_2025: world_press_photo_array_YAML as Model.tWorldPressPhoto2025YAML[],
    plek: plek_array_YAML as Model.tPlek[],
    activiteit: activiteit_array_YAML as Model.tActiviteit[],
    land_vertaling_mob: land_mob_YAML as Model.tLandVertalingYAML,
  }
}
