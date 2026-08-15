import './Logo.css'
import React from 'react'

export default class LogoComponent extends React.Component<{}> {
    constructor(p: {}) {
        super(p)
    }

    shouldComponentUpdate(nextProps: Readonly<{}>, nextState: Readonly<{}>, nextContext: any): boolean {
        return false
    }

    render() {
        let RATIO = 6 / 24
        let angle = Math.atan(RATIO) / Math.PI / 2 * 360

        return <div className="LogoBar">
            <div className="bar">
                <div className="space _left" style={{ transform: `skewX(${angle}deg)` }}></div>
                <svg className="logo" width="138px" height="30px" viewBox="0 35 138 30">
                    <path d="M 7 60 l12.5 -20 l12.5 20 Z" fill="red" />

                    <path d="M36 48 a 7 7 0 0 1 14 0 a 7 7 0 0 1 14 0" strokeWidth="2" stroke="red" fill="none"  />
                    
                    <path d="M35 51 l 30 0" strokeWidth="2" stroke="var(--clr-blue)" fill="none"  />
                    <path d="M35 55 l 30 0" strokeWidth="2" stroke="var(--clr-blue)" fill="none"  />
                    <path d="M35 59 l 30 0" strokeWidth="2" stroke="var(--clr-blue)" fill="none"  />

                    <text  x="67" y="48.5" fontSize="12.5" fill="red" strokeWidth="0.5" stroke="red" fontFamily="Arial">st</text>
                    <text y="59.5" x="67" fontSize="12.5" fill="red" stroke="red" strokeWidth="0.5">rd</text>

                    <path d="M81 60 l12.5 -20 l12.5 20 Z" fill="red" />
                    <path d="M109 60 a 7 7 0 0 1 14 0 a 7 7 0 0 1 14 0" strokeWidth="2" stroke="red" fill="none" />
                    <path d="M7 63 l 131 0" strokeWidth="2" stroke="var(--clr-blue)" fill="none" />
                </svg>
                <div className="space _right" style={{ transform: `skewX(-${angle}deg)` }}></div>
            </div>
        </div>
    }
}