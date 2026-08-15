import * as Model from './Model'
import * as Fetch from './Fetch'
import * as Util from './Util'


function create_stadsdeel_path_by_name_mob(stadsdeel_branch_array: Model.tStadsdeelYAML[]) {
  let stadsdeel_path_by_name_mob: { [stadsdeel_name: string]: string[] } = {}
  
  function transform_stadsdelen_array_to_mob(
    path: string[],
    stadsdeel_branch_array: Model.tStadsdeelYAML[]) {
    
    for (let stadsdeel_branch of stadsdeel_branch_array) {
      if (typeof stadsdeel_branch === 'string') {
        let path_child = [...path, stadsdeel_branch]
        stadsdeel_path_by_name_mob[stadsdeel_branch] = path_child
      } else if (typeof stadsdeel_branch === 'object') {
        let stadsdeel_branch_as_entry = Util.get_single_entry(stadsdeel_branch)
        let path_child = [...path, stadsdeel_branch_as_entry.key]
        stadsdeel_path_by_name_mob[stadsdeel_branch_as_entry.key] = path_child
        transform_stadsdelen_array_to_mob(path_child, stadsdeel_branch_as_entry.value)
      }
    }

    return stadsdeel_path_by_name_mob
  }

  transform_stadsdelen_array_to_mob([], stadsdeel_branch_array)

  return stadsdeel_path_by_name_mob
}

export function run(my_data: any, Flickr_album_data: any): Model.tSiteModel {
  let stadsdeel_path_by_name_mob = create_stadsdeel_path_by_name_mob(my_data.stadsdeel)

  let tag_map = new Map<string, Model.tTagDef>()
  function create_tag_if_new(type: Model.tTagType, name: string): Model.tTagDef {
    let key = type + ':' + name

    let tag_def = tag_map.get(key)

    if (tag_def === undefined) {
      tag_def = {
        key: key,
        type: type,
        name: name,
      }
      tag_map.set(key, tag_def)
    }

    return tag_def
  }

  function add_tag_if_new(type: Model.tTagType, name: string, tag_def_array: Model.tTagDef[]) {
    let tag_def = create_tag_if_new(type, name)

    let has_tag_def = tag_def_array.includes(tag_def)
    if (!has_tag_def) {
      tag_def_array.push(tag_def)
    }

    return tag_def
  }

  const TagDefOrder = ['activiteit', 'stad', 'stadsdeel', 'wijk', 'buurt', 'rivier', 'gracht', 'straat', 'persoon', 'gebouw', 'groep', 'bijnaam', 'interieur', 'architect', 'stijl', 'functie', 'eeuw', 'decennium', 'museum', 'tentoonstelling', 'voorwerp']
  let gebouw_2_array = (function tag_gebouw() {
    for (let gebouwYAML of my_data.gebouw) {
      let gebouw_tagged = Object.assign(gebouwYAML, { tags: [] }) as Model.tGebouw
      let tag_def_array: Model.tTagDef[] = []

      let tag_name_key = gebouwYAML.naam
      add_tag_if_new('gebouw', tag_name_key, tag_def_array)

      if (gebouwYAML.bijnaam !== undefined) add_tag_if_new('bijnaam', gebouwYAML.bijnaam, tag_def_array)
      if (gebouwYAML.groep !== undefined)  add_tag_if_new('groep', gebouwYAML.groep, tag_def_array)

      let tag_wijk_key = gebouwYAML.wijk
      add_tag_if_new('wijk', tag_wijk_key, tag_def_array)

      let tag_buurt_key = gebouwYAML.buurt
      if (tag_buurt_key !== undefined) add_tag_if_new('buurt', tag_buurt_key, tag_def_array)

      let tag_architect_key_array = gebouwYAML.architect
      for (let tag_architect_key of tag_architect_key_array) {
        add_tag_if_new('architect', tag_architect_key, tag_def_array)
      }

      let tag_stijl_key = gebouwYAML.stijl
      // TODO make key parameter undefinable and remove if statement
      if (tag_stijl_key !== undefined) add_tag_if_new('stijl', tag_stijl_key, tag_def_array)

      let tag_bouwjaar_key = gebouwYAML.bouwjaar
      if (tag_bouwjaar_key != null) {
        let year = tag_bouwjaar_key.toFixed(0)
        let decade = year.slice(0, 3) + 'x'
        let century = year.slice(0, 2) + 'xx'

        add_tag_if_new('decennium', decade, tag_def_array)
        add_tag_if_new('eeuw', century, tag_def_array)
      }

      for (let tag_functie_key of gebouwYAML.functie) {
        add_tag_if_new('functie', tag_functie_key, tag_def_array)
      }

      tag_def_array.sort(Util.Sort.feature.comparison.asc(
        Util.Sort.feature.order.place_in_array(TagDefOrder, Util.create_pick('type'), 'tag_def')
      ))
      let tag_array = tag_def_array.map(x => x.key)
      gebouw_tagged.tags.push(...tag_array)
    }

    return my_data.gebouw as (Model.tGebouwYAML & { tags: string[] })[]
  })()

  let foto_2_array = (function tag_foto() {
    for (let fotoYAML of my_data.foto) {
      let foto_tagged = fotoYAML as any as Model.tFoto

      let tag_array: Model.tTagDef[] = []

      function add_tag_def_existing(tag: string) {
        let tag_def = tag_map.get(tag)
        if (tag_def === undefined) throw new Model.AmsterdamError('no tag', {})
        add_tag_def(tag_def, tag_array)
      }

      function add_tag_def_new(type: Model.tTagType, name: string, tag_array: Model.tTagDef[]) {
        let tag_def = create_tag_if_new(type, name)
        add_tag_def(tag_def, tag_array)
      }

      function add_tag_def(tag_def: Model.tTagDef, tag_array: Model.tTagDef[]) {
          tag_array.push(tag_def)
      }

      // TODO use add_tag_def_new
      let Amsterdam_tag = create_tag_if_new('stad', 'Amsterdam')
      tag_array.push(Amsterdam_tag)

      for (let onderwerp of fotoYAML.onderwerp) {
        
        if (onderwerp.type === 'gebouw') {
          let gebouw = Util.find_in_array_by_item_property_or_throw(gebouw_2_array, ['naam'], onderwerp.key, 'not_found:gebouw')
          for (let tag of gebouw.tags) add_tag_def_existing(tag)
        } else if (onderwerp.type === 'interieur') {
          let gebouw = Util.find_in_array_by_item_property_or_throw(gebouw_2_array, ['naam'], onderwerp.parent_key, 'not_found:gebouw')
          for (let tag of gebouw.tags) add_tag_def_existing(tag)
          if ('interieur' in gebouw) {  
            let interieur = Util.find_in_array_or_throw(gebouw.interieur, onderwerp.key, 'not_found:interieur')
            add_tag_def_new('interieur', interieur, tag_array)
          }
        } else if (onderwerp.type === 'tentoonstelling') {
          let museum = Util.find_in_array_by_item_property_or_throw(my_data.museum, ['naam'], onderwerp.parent_key, 'not_found:museum')
          let tentoonstelling = Util.find_in_array_by_item_property_or_throw(museum.tentoonstelling, ['naam'], onderwerp.key, 'not_found:tentoonstelling')
          add_tag_def_new('museum', museum.naam, tag_array)
          add_tag_def_new('tentoonstelling', tentoonstelling.naam, tag_array)
        } else if (onderwerp.type === 'world_press_photo_2025') {
          add_tag_def_new('voorwerp', 'foto', tag_array)
          add_tag_def_new('museum', 'Nieuwe Kerk', tag_array)
          add_tag_def_new('tentoonstelling', 'World Press Photo 2025', tag_array)
        } else if (onderwerp.type === 'poster') {
          add_tag_def_new('voorwerp', 'poster', tag_array)
          add_tag_def_new('museum', 'EYE', tag_array)
          add_tag_def_new('tentoonstelling', 'Postergalerij Humie Pourseyf', tag_array)
        } else if (onderwerp.type === 'persoon') {
          add_tag_def_new('persoon', onderwerp.key, tag_array)
        } else if (onderwerp.type === 'stadsdeel') {
          let array_stadsdeel_type: Model.tTagType[] = ['stadsdeel', 'wijk', 'buurt']
          let stadsdeel_naam = onderwerp.key          
          let stadsdeel_path = Util.get_in_mob_by_key_or_throw(stadsdeel_path_by_name_mob, stadsdeel_naam, 'not_found:stadsdeel')
          
          for (let i = 0; i < stadsdeel_path.length; ++i) {
            let stadsdeel = stadsdeel_path[i]
            let stadsdeel_type = array_stadsdeel_type[i]
            add_tag_def_new(stadsdeel_type, stadsdeel, tag_array)
          }
        } else if (onderwerp.type === 'voorwerp') {
          add_tag_def_new('voorwerp', 'foto', tag_array)
        }
      }

      let tag_defs = [...new Set(tag_array)]
      tag_defs.sort(Util.Sort.feature.comparison.asc(
        Util.Sort.feature.order.place_in_array(TagDefOrder, Util.create_pick('type'), 'tag_def')
      ))
      foto_tagged.tags = tag_defs.map(a => a.key)
    }

    return my_data.foto as (Model.tFotoYAML & { tags: string[] })[]
  })()

  let foto_3_array = (function construct_foto_information() {
    for (let fotoYAML of foto_2_array) {
      let information: Model.tInformation[] = []
      for (let onderwerp of fotoYAML.onderwerp) {
        if (onderwerp.type === 'gebouw') {
          let gebouw = Util.find_in_array_by_item_property_or_throw(my_data.gebouw, ['naam'], onderwerp.key, 'not_found:gebouw')
          const {plain, translation} = Model.InformationText

          let lines: Model.tInformationItemEntry[] = []
          if (gebouw.architect.length > 0) {
            lines.push({
              type: 'line',
              label: translation('architect', 'architect'),
              values: gebouw.architect.map(plain),
            })
          }
          lines.push({
            type: 'line',
            label: translation('jaar', 'year'),
            values: [plain(`${gebouw.bouwjaar}`)],
          })
          if (gebouw.hoogte !== undefined) {
              lines.push({
                type: 'line',
                label: translation('hoogte', 'height'),
                values: [plain(`${gebouw.hoogte} m`)]
              })
          }

          let web: Model.tInformationLineLink[] = []
          if (gebouw.link?.['arcam.nl'] !== undefined) {
            web.push({
              type: 'arcam.nl',
              url: gebouw.link['arcam.nl'],
            })
          }
          if (gebouw.link?.architect !== undefined) {
            for (let architect of gebouw.link.architect) {
              web.push({
                type: 'architect',
                url: architect,
              })
            }
          }

          let information_item: Model.tInformation = {
            title: plain(gebouw.naam),
            lines: lines,
            extra: undefined,
            web: web,
          }
          information.push(information_item)
        } else if (onderwerp.type === 'world_press_photo_2025') {
          let world_press_photo_2025 = Util.find_in_array_by_item_property_or_throw(my_data.world_press_photo_2025, ['key'], onderwerp.key, 'not_found:world_press_photo_2025')

          const { plain, translation } = Model.InformationText

          let lines: Model.tInformationItemEntry[] = []
          lines.push({
            type: 'line',
            label: translation('fotograaf', 'photographer'),
            values: [plain(world_press_photo_2025.maker)]
          })

          let information_item: Model.tInformation = {
            title: plain(world_press_photo_2025.key),
            lines: lines,
            extra: {
              type: 'full',
              value: {
                type: 'translation',
                value: world_press_photo_2025.comment,
              },
            },
            web: [{
              type: 'world-press-photo-2025',
              url: world_press_photo_2025.web,
            }],
          }
          information.push(information_item)
        } else if (onderwerp.type === 'poster') {
          let eye_poster = Util.find_in_array_by_item_property_or_throw(my_data.eye_poster, ['naam'], onderwerp.key, 'gebouw:poster')

          const { plain, translation } = Model.InformationText
          function translation_land (nl: string) {
            let en = my_data.land_vertaling_mob[nl]
            return translation(nl, en)
          }

          let lines: Model.tInformationItemEntry[] = []
          lines.push({
            type: 'line',
            label: translation('land', 'country'),
            values: eye_poster.poster.land.map(translation_land),
          })
          lines.push({
            type: 'line',
            label: translation('jaar', 'year'),
            values: [plain(`${eye_poster.poster.jaar}`)],
          })
          if (eye_poster.poster.ontwerper.length !== 0) {
            lines.push({
              type: 'line',
              label: translation('ontwerper', 'designer'),
              values: eye_poster.poster.ontwerper.map(plain),
            })
          }
          if (eye_poster.film.regisseur.length !== 0) {
            lines.push({
              type: 'line',
              label: translation('regisseur', 'director'),
              values: eye_poster.film.regisseur.map(plain)
            })
          }

          let information_item: Model.tInformation = {
            title: plain(eye_poster.naam),
            lines: lines,
            extra: undefined,
            web: [{
              type: 'eye',
              url: 'https://www.eyefilm.nl',
            }],
          }

          information.push(information_item)
        }
      }

      (fotoYAML as Model.tFoto).information = information
    }

    return foto_2_array as (Model.tFotoYAML & { tags: string[], information: Model.tInformation[] })[]
  })()

  let foto_4_array = (function add_Flickr_data () {
    let foto_4_array = []
    
    for (let foto of foto_3_array) {
      let file_name = foto.bestand
      let dot_index = file_name.lastIndexOf('.')
      
      if (dot_index === -1) throw new Model.AmsterdamError('invalid filename', { value: file_name })
      
      let file_name_without_extension = file_name.slice(0, dot_index)
      let foto_4 = Object.assign(foto, {
        naam: file_name_without_extension,
      })
      foto_4_array.push(foto_4)
    }
    return foto_4_array
  })()

  let flickr_photo_map = new Map<string, any>()
  for (let flickr_photo of Flickr_album_data.photoset.photo) {
    flickr_photo_map.set(flickr_photo.title, flickr_photo)
  }

  let foto_5_array = (function add_Flickr_photo_data() {
    let foto_5_array = foto_4_array.map(x => {
      let flickr_photo = flickr_photo_map.get(x.naam) ?? undefined

      if (flickr_photo === undefined) {
        return Object.assign(x, {
          url: undefined
        })
      } else {
        let url: { [key in Model.tFotoSizes]: Model.tFotoURL } = {
          ['k']: {
            size: [flickr_photo.width_k, flickr_photo.height_k],
            url: flickr_photo.url_k,
          },
          ['3k']: {
            size: [flickr_photo.width_k, flickr_photo.height_k],
            url: flickr_photo.url_k,
          },
          ['4k']: {
            size: [flickr_photo.width_4k, flickr_photo.height_4k],
            url: flickr_photo.url_4k,
          },
          ['o']: {
            size: [flickr_photo.width_o, flickr_photo.height_o],
            url: flickr_photo.url_o,
          }
        }

        return Object.assign(x, { url: url })
      }
    })

    return foto_5_array
  })()

  let land_vertaling_map: { [key: string]: { nl: string, en: string } } = {}
  for (let land_nl in my_data.land_vertaling_mob) {
    let land_en = my_data.land_vertaling_mob[land_nl]
    land_vertaling_map[land_nl] = {
      nl: land_nl,
      en: land_en,
    }
  }

  return {
    foto: foto_5_array,
    gebouw: gebouw_2_array,
    tag_map: tag_map,
    eye_poster: my_data.eye_poster,
    land_vertaling_map: land_vertaling_map,
    world_press_photo_2025: my_data.world_press_photo_2025
  }
}

