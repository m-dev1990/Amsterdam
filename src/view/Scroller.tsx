import * as React from 'react'
import * as Util from '../Util'
import * as Model from '../Model'

import './Scroller.css'

export type tChildrenProps = {
    photo_index: number
}

export type tProps = {
    slide_selected_index: number
    slide_count: number
    children: (props: tChildrenProps) => React.ReactNode
    on_select_slide_index: (number: number) => void
}

export default class ScrollerComponent extends React.Component<tProps> {
    ref_el_scroller: React.RefObject<HTMLDivElement | null> = React.createRef<HTMLDivElement>()
    ref_el_scroll_area: React.RefObject<HTMLDivElement | null> = React.createRef<HTMLDivElement>()

    slide_selected_index: number

    scroll_width: number = Number.NaN
    // cached in order to prevent to trigger layouting using getBoundingRect
    slide_width: number = Number.NaN
    scroll_position_x: number = Number.NaN

    is_mouse_down: boolean = false
    has_mouse_moved: boolean = false
    mouse_position_x_previous: number = Number.NaN
    is_auto_scroll_on_mouse_down = false
    auto_scroll_direction_on_mouse_down: -1|1 = -1
    should_mouse_down_be_taken_into_account: boolean = false

    is_auto_scroll = false
    auto_scroll_direction: -1|1 = -1
    auto_scroll_position_x_target: number = Number.NaN

    constructor(props: tProps) {
        super(props)

        this.slide_selected_index = this.props.slide_selected_index
        
        window.addEventListener('resize', this.handle_resize)
    }

    componentDidMount(): void {
        let el_scroller = Util.get_ref(this, ['ref_el_scroller'], this.ref_el_scroller)
        let el_scroll_area = Util.get_ref(this, ['ref_el_scroll_area'], this.ref_el_scroll_area)
        
        // NOTE triggers re-layout
        this.slide_width = el_scroller.getBoundingClientRect().width

        this.scroll_position_x = this.slide_selected_index * this.slide_width      
        
        el_scroll_area.style.transform = `translateX(-${this.scroll_position_x}px)`

        window.document.addEventListener('keydown', this.handle_key_down)
    }

    shouldComponentUpdate(next_props: Readonly<tProps>, next_state: Readonly<{}>, next_context: any): boolean {
        return this.slide_selected_index !== next_props.slide_selected_index
            || this.props.slide_count !== next_props.slide_count
    }

    componentDidUpdate(prevProps: Readonly<tProps>, prevState: Readonly<{}>, snapshot?: any): void {
        console.log('update')
        if (this.props.slide_selected_index !== this.slide_selected_index) {
            this.slide_selected_index = this.props.slide_selected_index

            this.set_slide_immediately(this.props.slide_selected_index)
        }
    }

    // TODO better solution
    // prevent default: if content contains image, it should not be dragged
    handle_mouse_down_capture = (ev: React.MouseEvent) => {
        ev.preventDefault()
    }

    handle_mouse_down = (ev: React.MouseEvent) => {
        this.log(ev, 'start')

        // ignore second mouse button down
        // TODO is this correct
        if (this.is_mouse_down) return

        // tests for button no. 1: main/left button
        // TODO not tested, by lacking real mouse
        if (ev.buttons % 2 === 0) return

        let el_scroll_area = Util.get_ref(this, ['ref_el_scroll_area'], this.ref_el_scroll_area)

        // if is auto scrolling, set slide fixed at current position
        if (this.is_auto_scroll) {
            this.is_auto_scroll = false
            this.is_auto_scroll_on_mouse_down = true
            this.auto_scroll_direction_on_mouse_down = this.auto_scroll_direction

            // set current x in translateX transition progress
            // NOTE: triggers rerender => place is important for transition
            let translate_x = el_scroll_area.getBoundingClientRect().left
            this.scroll_position_x = -translate_x

            // NOTE: needs to be both after getBoudingClientRect call, because of rerender
            el_scroll_area.style.transitionProperty = 'none'
            el_scroll_area.style.transform = `translateX(-${this.scroll_position_x}px)`
        } else {
            el_scroll_area.style.transitionProperty = 'none'
            this.is_auto_scroll_on_mouse_down = false
        }

        this.is_mouse_down = true
        this.should_mouse_down_be_taken_into_account = true
        this.has_mouse_moved = false
        this.mouse_position_x_previous = ev.clientX

        this.log(ev, 'end')
    }

    handle_mouse_move = (ev: React.MouseEvent) => {
        if (!this.is_mouse_down) return

        // only log first
        if (!this.has_mouse_moved) this.log(ev, 'start')

        if (!this.should_mouse_down_be_taken_into_account) return

        let el_scroll_area = Util.get_ref(this, ['ref_el_scroll_area'], this.ref_el_scroll_area)
        
        Util.assert_defined(this.slide_width)
        Util.assert_defined(this.scroll_position_x)
        Util.assert_defined(this.mouse_position_x_previous)

        // move photo by move_distance,
        //      but avoid scrolling out of bounds
        let mouse_position_x = ev.clientX
        let move_distance = this.mouse_position_x_previous - mouse_position_x

        let container_width = el_scroll_area.clientWidth
        let max_scroll = container_width - this.slide_width
        let scroll_position_x_old = this.scroll_position_x
        let scroll_position_x_new = scroll_position_x_old + move_distance
        if (scroll_position_x_new < 0) {
            scroll_position_x_new = 0
        } else if (max_scroll < scroll_position_x_new) {
            scroll_position_x_new = max_scroll
        }

        el_scroll_area.style.transform = `translateX(-${scroll_position_x_new}px)`

        this.mouse_position_x_previous = mouse_position_x
        this.scroll_position_x = scroll_position_x_new
        this.has_mouse_moved = true

        var slide_selected_index_old = this.slide_selected_index
        this.slide_selected_index = Math.round(this.scroll_position_x / this.slide_width)
        if (slide_selected_index_old !== this.slide_selected_index) {
            this.props.on_select_slide_index(this.slide_selected_index)
        }
    }

    handle_mouse_up = (ev: React.MouseEvent) => {
        this.log(ev, 'start')

        // TODO handle arrow push when mouse down
        if (!this.is_mouse_down || !this.should_mouse_down_be_taken_into_account) return
        
        Util.assert_defined(this.scroll_position_x)
        Util.assert_defined(this.slide_width)

        this.is_mouse_down = false

        if (this.has_mouse_moved) {
            this.continue_auto_scroll()
        } else {
            this.command_move(1, this.is_auto_scroll_on_mouse_down, this.auto_scroll_direction_on_mouse_down)
        }
    }

    handle_transition_start = (ev: React.TransitionEvent) => {
        ev.persist
    }

    handle_transition_end = (ev: React.TransitionEvent) => {
        this.log(ev, 'start')

        let el_scroll_area = Util.get_ref(this, ['ref_el_scroll_area'], this.ref_el_scroll_area)
        Util.assert_defined(this.auto_scroll_position_x_target)

        this.scroll_position_x = this.auto_scroll_position_x_target
        this.is_auto_scroll = false

        el_scroll_area.style.transitionProperty = 'none'
    }

    handle_transition_cancel = (ev: React.TransitionEvent) => {

    }

    handle_mouse_enter = (ev: React.MouseEvent) => {
        
    }

    handle_mouse_leave = (ev: React.MouseEvent) => {
        this.log(ev, 'start')

        if ((this.is_mouse_down && this.should_mouse_down_be_taken_into_account) || this.is_auto_scroll) {
            this.is_mouse_down = false
            this.set_slide_immediately(this.slide_selected_index)
        }
    }

    handle_key_down = (ev: KeyboardEvent) => {
        if (! (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight')) return
        
        this.log(ev, 'start')

        let move_direction: -1|1        
        if (ev.key === 'ArrowLeft') {
            move_direction = -1
        } else if (ev.key === 'ArrowRight') {
            move_direction = 1
        } else throw new Model.AmsterdamError('error-in-programmer-brain', {})

        this.command_move(move_direction, this.is_auto_scroll, this.auto_scroll_direction)
    }

    handle_resize = (ev: UIEvent) => {
        this.log(ev, 'start')

        if ((this.is_mouse_down && this.should_mouse_down_be_taken_into_account) || this.is_auto_scroll) {
            this.should_mouse_down_be_taken_into_account = false
            this.set_slide_immediately(this.slide_selected_index)
        }
    }

    // handle click or arrow key push
    command_move = (move_direction: -1|1, is_auto_scroll: boolean, auto_scroll_direction: -1|1) => {
        console.log('command_move', move_direction, is_auto_scroll, auto_scroll_direction)
        if (!is_auto_scroll) {
            let slide_selected_index_next = this.slide_selected_index + move_direction

            if (0 <= slide_selected_index_next && slide_selected_index_next < this.props.slide_count) {
                this.slide_selected_index = slide_selected_index_next
                this.is_auto_scroll = true
                this.auto_scroll_direction = move_direction            
                this.auto_scroll_position_x_target = this.slide_selected_index * this.slide_width

                let transition_duration_in_s = 1.2

                let el_scroll_area = Util.get_ref(this, ['ref_el_scroll_area'], this.ref_el_scroll_area)

                el_scroll_area.style.transitionProperty = 'transform'
                el_scroll_area.style.transitionDuration = transition_duration_in_s + 's'
                el_scroll_area.style.transform = `translateX(-${this.auto_scroll_position_x_target}px)`

                this.props.on_select_slide_index(this.slide_selected_index)
            }
        } else {
            // continue scrolling in other direction
            if (move_direction !== auto_scroll_direction) {
                let el_scroll_area = Util.get_ref(this, ['ref_el_scroll_area'], this.ref_el_scroll_area)
                
                this.slide_selected_index = this.slide_selected_index + move_direction
                this.is_auto_scroll = true
                this.auto_scroll_direction = move_direction
                this.auto_scroll_position_x_target = this.slide_selected_index * this.slide_width
                this.scroll_position_x = -el_scroll_area.getBoundingClientRect().left

                let scroll_progress_current_photo_in_px = Math.abs(this.scroll_position_x - this.auto_scroll_position_x_target)
                let scroll_progress_current_photo_ratio = scroll_progress_current_photo_in_px / this.slide_width
                let transition_duration_in_s = scroll_progress_current_photo_ratio * 1.2

                el_scroll_area.style.transitionProperty = 'none'
                el_scroll_area.style.transform = `translateX(-${this.scroll_position_x}px)`
                
                // requestAnimationFrame, otherwise transition is performed to quickly
                requestAnimationFrame(_=> {
                    el_scroll_area.style.transitionProperty = 'transform'
                    el_scroll_area.style.transitionDuration = transition_duration_in_s + 's'
                    el_scroll_area.style.transform = `translateX(-${this.auto_scroll_position_x_target}px)`
                })

                this.props.on_select_slide_index(this.slide_selected_index)
            } else {
                // immediately scroll to slide
                this.scroll_position_x = this.slide_selected_index * this.slide_width
                this.is_auto_scroll = false

                let el_scroll_area = Util.get_ref(this, ['ref_el_scroll_area'], this.ref_el_scroll_area)

                el_scroll_area.style.transitionProperty = 'none'
                el_scroll_area.style.transform = `translateX(-${this.scroll_position_x}px)`
            }
        }
    }

    continue_auto_scroll = () => {
        console.log('continue auto scroll')

        let el_scroll_area = Util.get_ref(this, ['ref_el_scroll_area'], this.ref_el_scroll_area)

        this.auto_scroll_position_x_target = this.slide_selected_index * this.slide_width

        if (this.auto_scroll_position_x_target === this.scroll_position_x) return

        if (this.auto_scroll_position_x_target < this.scroll_position_x) {
            this.auto_scroll_direction = -1
        } else {
            this.auto_scroll_direction = 1
        }

        // calculate duration
        let scroll_progress_current_photo_in_px = Math.abs(this.scroll_position_x - this.auto_scroll_position_x_target)
        let scroll_progress_current_photo_ratio = scroll_progress_current_photo_in_px / this.slide_width
        let transition_duration_in_s = scroll_progress_current_photo_ratio * 1.2

        el_scroll_area.style.transitionProperty = 'transform'
        el_scroll_area.style.transform = `translateX(-${this.auto_scroll_position_x_target}px)`
        el_scroll_area.style.transitionDuration = transition_duration_in_s + 's'
    }

    set_slide_immediately = (slide_selected_index: number) => {
        console.log('set_slide_immediately')

        this.slide_selected_index = slide_selected_index
        this.scroll_position_x = this.slide_selected_index * this.slide_width
        this.is_auto_scroll = false

        let el_scroll_area = Util.get_ref(this, ['ref_el_scroll_area'], this.ref_el_scroll_area)

        el_scroll_area.style.transitionProperty = 'none'
        el_scroll_area.style.transform = `translateX(-${this.scroll_position_x}px)`
    }

    render() {
        return <div className="Scroller"
            ref={ this.ref_el_scroller }>
            <div
                ref={ this.ref_el_scroll_area }
                className="scroll_area"
                onMouseDownCapture={this.handle_mouse_down_capture}
                onMouseDown={this.handle_mouse_down}
                onMouseMove={this.handle_mouse_move}
                onMouseUp={this.handle_mouse_up}
                onTransitionStart={this.handle_transition_start}
                onTransitionCancel={this.handle_transition_cancel}
                onTransitionEnd={this.handle_transition_end}
                onMouseEnter={this.handle_mouse_enter}
                onMouseLeave={this.handle_mouse_leave}
                >
                { [...this.render_children()] }
            </div>
        </div>
    }

    * render_children() {
        for (let i = 0; i < this.props.slide_count; ++i) {
            yield this.props.children({ photo_index: i })
        }
    }

    log(event: React.SyntheticEvent|Event, phase: string) {
        if (import.meta.env.DEV) {
            console.log(event.type, phase, event, this.ref_el_scroll_area.current,
                {
                    is_mouse_down: this.is_mouse_down,
                    mousePreviousStep: this.mouse_position_x_previous,
                    containerPositionLeft: this.scroll_position_x,
                    containerPositionLeftNext: this.auto_scroll_position_x_target,
                    is_auto_scrolling: this.auto_scroll_direction,
                    css: {
                        auto_move: this.ref_el_scroll_area.current?.classList.contains('_auto_move'),
                    }
                })
        }
    }
}