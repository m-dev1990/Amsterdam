import * as Model from './Model'
import * as Util from './Util'
import AmsterdamNavigation from './Navigation'
import AmsterdamStorage from './Storage'
import * as Process from './Process'
import * as FlickrServer from './FlickrServer'
import * as MyInformationData from './Fetch'
import FlickrAlbumAmsterdamJSON from './information/Flickr-album-Amsterdam.json'

class AmsterdamEngine {
    #model: Model.tSiteModel|undefined

    constructor() {}

    async start() {
        try {
            window.document.documentElement.lang = AmsterdamNavigation.select_language_code()
            
            let Flickr_oauth_access_token = AmsterdamNavigation.select_and_remove_Flickr_oauth_access_token()
            if  (Flickr_oauth_access_token !== undefined) {
                AmsterdamStorage.set_Flickr_oauth_access_token(Flickr_oauth_access_token)
            } else {
                Flickr_oauth_access_token = AmsterdamStorage.get_Flickr_oauth_access_token()
            }

            let data = MyInformationData.get()

            let Flickr_album
            if (Flickr_oauth_access_token === undefined) {
                Flickr_album = FlickrAlbumAmsterdamJSON
            } else {
                let is_logged_in
                [is_logged_in, Flickr_album] = await FlickrServer.fetch_album_photos(Flickr_oauth_access_token)
                if (!is_logged_in) {
                    AmsterdamStorage.clear_Flickr_oauth_access_token()
                    Flickr_album = FlickrAlbumAmsterdamJSON
                }
            }

            this.#model = Process.run(data, Flickr_album)
        } catch (err) {
            if (err instanceof Model.AmsterdamError) {
                console.error(err, err.parameters)
            } else {
                console.error(err)
            }
            
            throw err
        }
    }

    get is_ready() {
        return this.#model !== undefined
    }

    get model() {
        Util.assert_defined(this.#model)
        return this.#model
    }

    select_language_code() {
        return AmsterdamNavigation.select_language_code()
    }

    select_fotoos() {
        let tag_def_selected_array = AmsterdamNavigation.select_tag_def_array()
        
        if (tag_def_selected_array.length === 0) {
            return this.model.foto
        } else {
            return this.model.foto.filter(foto_tagged =>
                foto_tagged.tags.some((foto_tag_key: string) =>
                    tag_def_selected_array.every(selected_tag_def => selected_tag_def.key === foto_tag_key)
                ) ?? false
            )
        }
    }

    select_foto_index = AmsterdamNavigation.select_foto_index.bind(AmsterdamNavigation)

    select_tag_def_array = AmsterdamNavigation.select_tag_def_array.bind(AmsterdamNavigation)

    change_foto_index = AmsterdamNavigation.change_foto_index.bind(AmsterdamNavigation)

    change_tag_def_array = AmsterdamNavigation.change_tag_def_array.bind(AmsterdamNavigation)

    build_href = AmsterdamNavigation.build_href.bind(AmsterdamNavigation)

    select_Flickr_oauth_access_token() {
        return AmsterdamStorage.get_Flickr_oauth_access_token()
    }

    indicate_Flickr_oauth_no_longer_logged_in() {
        AmsterdamStorage.clear_Flickr_oauth_access_token()
    }

    get_login_url() {
        let current_search_params = AmsterdamNavigation.get_current_search_params()
        return FlickrServer.get_login_url(current_search_params)
    }
}

export default new AmsterdamEngine()