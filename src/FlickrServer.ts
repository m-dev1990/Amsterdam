import * as AmsterdamTypes from './Model'
import AmsterdamEngine from './Engine'
let is_dev = import.meta.env.DEV

const Server = {
    URL: {
        get() {
            return is_dev ? this.DEVELOPMENT : this.PRODUCTION
        },
        DEVELOPMENT: 'http://localhost:1990',
        PRODUCTION: 'https://amsterdam-server.vercel.app',
    }
}

export async function fetch_album_photos (Flickr_oauth_access_token: string|undefined) {    
    let request_url = new URL(`${Server.URL.get()}/Flickr/album?album=Amsterdam&oauth_token=${Flickr_oauth_access_token}`)

    let response = await fetch(request_url, { method: 'GET' })

    // OAuth access token is no longer kept on the server
    if (response.status === 401) {
        return [false, undefined]
    }

    if (response.status >= 400) {
        throw new AmsterdamTypes.AmsterdamError('Flickr', {
            statusCode: response.status,
            statusText: response.statusText,
        })
    }

    let data = await response.json()

    return [true, data]
}

export function get_login_url(current_search_params: URLSearchParams): string | undefined {
    return `${Server.URL.get()}/Flickr/oauth/start?${current_search_params.toString()}`
}
