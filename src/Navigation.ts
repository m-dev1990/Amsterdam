import * as React from 'react'
import * as Model from './Model'
import AmsterdamModel from './Engine'
import * as Util from './Util'

class AmsterdamNavigation {
    #Flickr_oauth_access_token: string|undefined = undefined
    #array_tags: string[] = ['Flickr_oauth_access_token']
    #fn_listener_array: (() => void)[] = []

    language_mob: { [language_key in Model.tLanguageCodes]: string } = {
        nl: 'Nederlands',
        en: 'Engels',
    }

    constructor() {
        
    }

    activate = () => {
        window.addEventListener('popstate', this.#handle_location_change)
    }

    #handle_location_change = () => {
        for (let fn_listener of this.#fn_listener_array) {
            fn_listener()
        }
    }

    add_event_listener = (fn_listener: () => void) => {
        this.#fn_listener_array.push(fn_listener)
    }

    remove_event_listener = (fn_listener: () => void) => {
        let index = this.#fn_listener_array.indexOf(fn_listener)
        this.#fn_listener_array.splice(index, 1)
    }


    get_current_search_params() {
        return new URL(window.location.href).searchParams
    }

    // select
    select_foto_index() {
        let url = new URL(window.location.href)

        let foto_index_1_str = url.searchParams.get('foto')

        let foto_index = 0
        if (foto_index_1_str !== null) {
            let foto_index1 = Util.parse_integer(foto_index_1_str, 'query_parameter:foto:not_valid')
            foto_index = foto_index1 - 1

            if (foto_index >= AmsterdamModel.model.foto.length) throw new Model.AmsterdamError('query_parameter:foto:out_of_bounds', {
                value: foto_index
            })
        }

        return foto_index
    }

    select_language_code(): Model.tLanguageCodes {
        let url = new URL(window.location.href)
        let language_name = url.searchParams.get('taal')

        let language_code: Model.tLanguageCodes
        if (language_name) {
            let entry = Util.get_entries(this.language_mob).find(([key, name]) => name ===  language_name)
            if (entry === undefined) throw new Model.AmsterdamError('query_parameter.taal:not_found', {
                value: language_name,
            })
            language_code = entry[0]
        } else {
            language_code  = 'nl'
        }

        return language_code
    }

    select_tag_def_array() {
        let url = new URL(window.location.href)
       
        let tag_def_selected_array = [...url.searchParams.entries()]
            .filter(([k, v]) => !['foto', 'taal'].includes(k))
            .map(entry => {
                return Util.get_in_map_by_key_or_throw(AmsterdamModel.model.tag_map, entry[0] + ':' + entry[1], 'query_parameter.tag:not_found')
            })

        return tag_def_selected_array
    }

    // change
    change_foto_index(foto_index: number) {
        let foto_index_prev = this.select_foto_index()
        if (foto_index_prev !== foto_index) {
            this.#update_URL({
                foto_index: foto_index,
                laguage_code: this.select_language_code(),
                tag_def_array: this.select_tag_def_array(),
            })
        }
    }

    change_taal(language_code: Model.tLanguageCodes) {
        let language_code_prev = this.select_language_code()
        
        if (language_code !== language_code_prev) {
            this.#update_URL({
                foto_index: this.select_foto_index(),
                laguage_code: language_code,
                tag_def_array: this.select_tag_def_array(),
            })
        }             
    }

    change_tag_def_array(tag_def_array: Model.tTagDef[]) {
        let tag_def_array_prev = this.select_tag_def_array()
        let tag_def_selected_set = new Set([...tag_def_array_prev, ...tag_def_array])
        
        if (tag_def_array_prev.length !== tag_def_selected_set.size) {
            let language_code = this.select_language_code()

            this.#update_URL({
                foto_index: 0,
                laguage_code: language_code,
                tag_def_array: tag_def_array,
            })
        }
    }

    select_and_remove_Flickr_oauth_access_token = () => {
        let url = new URL(window.location.href)
        let Flickr_oauth_access_token = url.searchParams.get('Flickr_oauth_access_token') ?? undefined
        url.searchParams.delete('Flickr_oauth_access_token')
        window.history.replaceState({ }, '', url)
        return Flickr_oauth_access_token
    }

    // build href
    build_href(p: { foto_index?: number, language_code?: Model.tLanguageCodes, tag_def_array?: Model.tTagDef[] }) {
        return this.#build_href({
            foto_index: p.foto_index,
            language_code: p.language_code ?? this.select_language_code(),
            tag_def_array: p.tag_def_array,
        })
    }

    #build_href(p: { foto_index: number|undefined, language_code: Model.tLanguageCodes|undefined, tag_def_array: Model.tTagDef[]|undefined }) {
        let url = new URL(window.location.href)
        url.search = ''

        let foto_index = p.foto_index ?? this.select_foto_index()
        let foto_index_str = (foto_index + 1).toString()
        url.searchParams.set('foto', foto_index_str)

        let language_code = p.language_code ?? this.select_language_code()
        let taal = this.language_mob[language_code]
        url.searchParams.set('taal', taal)

        for (let tag_def of p.tag_def_array ?? this.select_tag_def_array()) {
            url.searchParams.set(tag_def.type, tag_def.name)
        }
        let href = url.toString()
        
        return href
    }

    #update_URL(props: { foto_index?: number, laguage_code?: Model.tLanguageCodes, tag_def_array?: Model.tTagDef[] }) {
        let href = this.#build_href({
            foto_index: props.foto_index,
            language_code: props.laguage_code,
            tag_def_array: props.tag_def_array,
        })
        window.history.pushState({ }, '', href)
        this.#handle_location_change()
    }
}

export default new AmsterdamNavigation()