export default new class AmsterdamStorage {
    get_Flickr_oauth_access_token() {
        return window.localStorage.getItem('http://www.flickr.com/oauth_access_token') ?? undefined
    }

    set_Flickr_oauth_access_token(Flickr_oauth_access_token: string) {
        window.localStorage.setItem('http://www.flickr.com/oauth_access_token', Flickr_oauth_access_token)
    }

    clear_Flickr_oauth_access_token() {
        window.localStorage.removeItem('http://www.flickr.com/oauth_access_token')
    }
}