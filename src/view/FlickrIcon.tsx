import React from 'react'
import AmsterdamEngine from '../Engine'

import './FlickrIcon.css'

export default class FlickrIcon extends React.Component {
    render() {
        return <a className="FlickrIcon" href={ AmsterdamEngine.get_login_url() }>
            <svg width="52" height="28">
                <circle r="9" cx="14" cy="14" strokeWidth={1} stroke="var(--clr-blue)" fill="var(--clr-blue)" />
                <circle r="9" cx="38" cy="14" strokeWidth={1} stroke="white" fill="var(--clr-red)" />
            </svg>
            <div className="name">
                FLICKR
            </div>
        </a>
    }
}