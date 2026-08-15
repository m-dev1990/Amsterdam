import './Tags.css'

import React from 'react'
import AmsterdamEngine from '../Engine'
import * as Model from '../Model'

type tProps = {
    foto: Model.tFoto,
    on_change_tag_def: (tag_def: Model.tTagDef) => void
}

export default class TagsComponent extends React.Component<tProps> {    
    render() {
        let tag_def_selected_array = AmsterdamEngine.select_tag_def_array()

        return <div className="foto_tag_list">
            {
                [...this.props.foto.tags].map(tag => {
                        let tag_def = AmsterdamEngine.model.tag_map.get(tag)
                        if (tag_def === undefined) throw new Model.AmsterdamError('not-found-tag', { tag: tag, })
                        return tag_def
                    })
                    .map((tag_def, i) => {
                        let is_tag_def_selected = tag_def_selected_array.find(x => x.key === tag_def.key) !== undefined ? true : false
                        return <TagComponent
                            key={ tag_def.key }
                            index={ i }
                            tag_def_is_selected={ is_tag_def_selected }
                            tag_def={ tag_def }
                            on_change_tag_def={ this.props.on_change_tag_def } />
                    })
            }
        </div>
    }
}

type tPropsLink = {
    index: number
    tag_def: Model.tTagDef
    tag_def_is_selected: boolean
    on_change_tag_def: (tag_def: Model.tTagDef) => void
}

class TagComponent extends React.Component<tPropsLink> {
    constructor(props: tPropsLink) {
        super(props)
    }

    handle_URL_click = (ev: React.MouseEvent) => {
        ev.preventDefault()
        
        this.props.on_change_tag_def(this.props.tag_def)
    }

    handle_mouse_event = (ev: React.MouseEvent) => {
        ev.stopPropagation()
    }


    render() {
        let tag_def_active_array = AmsterdamEngine.select_tag_def_array()
        let is_tag_active = tag_def_active_array.find(x => x.key === this.props.tag_def.key)
        
        return <div key={this.props.tag_def.key}
            className="foto_tag_container"
            style={{ marginLeft: 6 * this.props.index, }}>
            <a className={ `foto_tag ${is_tag_active ? '_active' : ''}` }
                href={ AmsterdamEngine.build_href({ foto_index: 1, tag_def_array: [this.props.tag_def], }) }
                onClick={ this.handle_URL_click }
                onMouseDown={this.handle_mouse_event}
                onMouseMove={this.handle_mouse_event}
                onMouseUp={this.handle_mouse_event}
                >
                #{this.props.tag_def.name}
            </a>
        </div>
    }
}
