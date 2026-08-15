import './Site.css'

import * as React from 'react'
import * as Model from '../Model'
import AmsterdamTranslate from '../Translate'
import AmsterdamNavigation from '../Navigation'
import AmsterdamEngine from '../Engine'
import * as FlickrServer from '../FlickrServer'
import ScrollerComponent from './Scroller'
import type * as ScrollerComponentTypes from './Scroller'
import InformationFactsComponent from './InformationFacts'
import InformationDescriptionComponent from './InformationDescription'
import TagsComponent from './Tags'
import LogoComponent from './Logo'
import FlickrIcon from './FlickrIcon'
import * as ViewText from './ViewText'

type tProps = {
    
}

class SiteComponent extends React.Component<tProps> {
    constructor(p: tProps) {
        super(p)

        AmsterdamNavigation.add_event_listener(this.#handle_url_change)
    }

    #handle_url_change = () => {
        this.forceUpdate()
    }

    handle_tag_def_array_change = (tag_def: Model.tTagDef) => {
        AmsterdamEngine.change_tag_def_array([tag_def])
    }

    handle_select_slide_index(number: number) {
        AmsterdamEngine.change_foto_index(number)
    }

    render() {
        console.log('Site')

        let fotoos = AmsterdamEngine.select_fotoos()
        let foto_index = AmsterdamEngine.select_foto_index()

        return <div className="Site">
            <div className="content">
                <ScrollerComponent
                    slide_selected_index={ foto_index }
                    on_select_slide_index={ this.handle_select_slide_index }
                    slide_count={ fotoos.length }>
                    {(props: ScrollerComponentTypes.tChildrenProps) => {
                        let foto = fotoos[props.photo_index]
                        if (foto.url === undefined) {
                            return <div key={foto.naam} className="message_private">
                                <div className="message_private_text">
                                    { AmsterdamTranslate.translate(ViewText.photo_not_logged_in_message) }
                                </div>
                                <a className="message_private_link" href={ AmsterdamEngine.get_login_url() }>
                                    { AmsterdamTranslate.translate(ViewText.photo_not_logged_in_login_button) }
                                </a>
                            </div>
                        }

                        let size_format = Object.values(foto.url).find(url => url.size[0] > window.innerWidth && url.size[1] > window.innerHeight) ?? foto.url.o
                        
                        return <div key={foto.naam} className="foto_C">
                            <div className="foto_box">
                                <img className="foto" src={size_format.url} loading="lazy"/>
                            </div>
                            <div className="foto_tags">
                               <TagsComponent
                                    foto={foto}
                                    on_change_tag_def={this.handle_tag_def_array_change} />
                            </div>
                            <div className="information_description_panel">
                                <InformationDescriptionComponent model={AmsterdamEngine.model} foto_naam={foto.naam}  />
                            </div>
                            <div className="information_facts_panel">
                                <InformationFactsComponent model={foto.information}  />
                            </div>
                        </div>
                    }}
                </ScrollerComponent>
            </div>

            <LogoComponent />

            <div className="FlickrIcon_positioner">
                <FlickrIcon />
            </div>
            
        </div>
    }
}

export default SiteComponent