import * as React from 'react'
import type * as Model from '../Model'
import * as Util from '../Util'
import Translate from '../Translate'

import './InformationDescription.css'

type tProps = {
    model: Model.tSiteModel
    foto_naam: string
}

export default class InformationDescriptionComponent extends React.Component<tProps> {
    render() {
        let foto_naam = this.props.foto_naam
        let foto = Util.find_in_array_by_item_property_or_throw(this.props.model.foto, ['naam'], foto_naam, 'not_found:foto')        
        let description = foto.information[0]?.extra

        if (description === undefined) return

        return description && <div className="foto_description">
            { Translate.translate(description.value) }           
        </div>
    }
}