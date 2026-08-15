import './InformationFacts.css'

import * as React from 'react'
import * as Model from '../Model'
import Translate from '../Translate'

type tProps = {
    model: Model.tInformation[]
}

export default class InformationFactsComponent extends React.Component<tProps> {
    handle_mouse_event = (ev: React.MouseEvent) => {
        ev.stopPropagation()
    }
 
    render() {
        let MARGIN_LINE = 15
        let info_margin = MARGIN_LINE

        let RATIO = 6 / 24
        let angle = -(Math.PI - Math.atan(RATIO))

        function translateX(margin: number) {
            return {
                transform: `translateX(${margin}px)`
            }
        }

        function capitalize(text: string) {
            return text.substring(0, 1).toUpperCase() + text.substring(1)
        }

        let elOnderwerp_array = this.props.model.map((o, i) => {
            let is_last = i === (this.props.model.length - 1)

            let info_margin_blok = 0
            let row = 0
            function step(number: number) {
                info_margin += number * RATIO
                info_margin_blok += number * RATIO
                ++row
                return undefined
            }

            return <div key={i} className="info_subject"
                style={{
                    ["--angle"]: angle + 'rad',
                    ...translateX(info_margin),
                } as React.StyleHTMLAttributes<HTMLDivElement>}>
                
                <div className="info_border"></div>

                <div className="info_link_list">
                    { o.web.map(x => {
                        return <div key={ x.url } className="info_link_item">
                            <div className="info_link_circle">
                                <a className="info_link_symbol" 
                                    href={x.url} target="_blank"
                                    onMouseDown={this.handle_mouse_event}
                                    onMouseMove={this.handle_mouse_event}
                                    onMouseUp={this.handle_mouse_event}>
                                    {
                                        x.type === 'arcam.nl' ? <div className="info_link_symbol_arcam">
                                            c
                                        </div> : ''
                                    }
                                    {
                                        x.type === 'world-press-photo-2025' ? <div className="info_link_symbol_world_press_photo_2025">
                                            { '🌍\uFE0E' }
                                        </div> : ''
                                    }
                                    { 
                                        x.type === 'eye' ? <div className="info_link_symbol_eye">
                                            👁
                                        </div> : ''
                                    }
                                    {
                                        x.type === 'architect' ? <div className="info_link_symbol_architect">
                                            ⌂
                                        </div> : ''
                                    }
                                </a>
                                
                            </div>
                            <div className="info_link_line"></div>
                        </div>
                        })
                    }
                </div>

                <div className="info_data">
                    <div className="info_title_box">
                        <div className="info_title_border_left"
                            style={{ ['--x' as any]: `${info_margin_blok}` }}></div>
                        
                        <div className="info_title" style={{
                            gridRow: row + 1,
                            ...translateX(info_margin_blok),
                        }}>
                            <div className="info_title">{o.title.value}</div>
                        </div>

                        <div className="info_title_border_right"
                            style={{ ...translateX(info_margin_blok) }}></div>
                    </div>

                    {step(24)}
                    {step(6)}

                    {o.lines.map((x, i) => {
                        return <div key={i} className="info_gebouw_line">
                            <div className="info_label"
                                style={{
                                    gridRow: 1,
                                    ...translateX(info_margin_blok),
                                }}>
                                {capitalize(Translate.translate(x.label))}:
                            </div>
                            {x.values.map((value, j) => {
                                return <div
                                    key={j}
                                    className="info_value"
                                    style={{
                                        gridRow: j + 1,
                                        ...translateX(info_margin_blok),
                                    }}>
                                    {Translate.translate(value)}
                                    {step(21)}
                                </div>
                            })}
                        </div>
                    })}

                    { is_last || step(12)}

                </div>
            </div>
        })

        // after rendering content in order for having margin
        return <div className="foto_info"
            style={{
                ...translateX(-info_margin),
                marginLeft: info_margin + 'px',
            }}>
            {elOnderwerp_array}
        </div>
    }
}
