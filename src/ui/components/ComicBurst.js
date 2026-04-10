// ui/components/ComicBurst.js
import { html } from 'htm/preact';
import { BaseComponent } from './BaseComponent.js';

export class ComicBurst extends BaseComponent {
    constructor(props = {}) {
        super(props);
        this.state = {
            text: props.text || 'BOOM!',
            type: props.type || 'default', // default, winner, explosion
            duration: props.duration || 3000,
            autoHide: props.autoHide !== false,
            visible: true
        };
        this.props = props;
    }

    componentDidMount() {
        if (this.state.autoHide) {
            setTimeout(() => {
                this.setState({ visible: false });
                if (this.props.onComplete) {
                    this.props.onComplete();
                }
            }, this.state.duration);
        }
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        if (this.element) {
            // re-render manually if element exists (non-React environment)
            this.element.innerHTML = this.renderToString();
        }
    }

    renderToString() {
        if (!this.state.visible) return '';
        const burstClass = `comic-burst-memphis ${this.state.type}`;
        return `<div class="${burstClass}" style="${this.props.style || ''}">${this.state.text}</div>`;
    }

    render() {
        if (!this.state.visible) {
            return null;
        }

        const burstClass = `comic-burst-memphis ${this.state.type}`;
        
        return html`
            <div class="${burstClass}" style="${this.props.style || ''}">
                ${this.state.text}
            </div>
        `;
    }

    // Static factory methods for common burst types
    static winner(text = 'WINNER!', onComplete) {
        return new ComicBurst({
            text,
            type: 'winner',
            duration: 2000,
            onComplete
        });
    }

    static explosion(text = 'BOOM!', onComplete) {
        return new ComicBurst({
            text,
            type: 'explosion',
            duration: 1500,
            onComplete
        });
    }

    static notification(text, onComplete) {
        return new ComicBurst({
            text,
            type: 'default',
            duration: 3000,
            onComplete
        });
    }
}

// Speech bubble component
export class SpeechBubble extends BaseComponent {
    constructor(props = {}) {
        super(props);
        this.props = props;
    }

    render() {
        return html`
            <div class="speech-bubble-memphis" style="${this.props.style || ''}">
                ${this.props.children}
            </div>
        `;
    }
}

// Action lines animation component
export class ActionLines extends BaseComponent {
    constructor(props = {}) {
        super(props);
        this.props = props;
    }

    render() {
        return html`
            <div class="action-lines-memphis" style="${this.props.style || ''}">
            </div>
        `;
    }
}

// Comic panel wrapper
export class ComicPanel extends BaseComponent {
    constructor(props = {}) {
        super(props);
        this.props = props;
    }

    render() {
        return html`
            <div class="comic-panel-memphis" style="${this.props.style || ''}">
                ${this.props.children}
            </div>
        `;
    }
}

// Notification badge
export class NotificationBadge extends BaseComponent {
    constructor(props = {}) {
        super(props);
        this.props = props;
    }

    render() {
        const count = this.props.count || 0;
        if (count <= 0) return null;

        return html`
            <div class="notification-badge-memphis">
                ${count > 99 ? '99+' : count}
            </div>
        `;
    }
}

// Progress bar with Memphis styling
export class ProgressBar extends BaseComponent {
    constructor(props = {}) {
        super(props);
        this.props = props;
    }

    render() {
        const progress = Math.max(0, Math.min(100, this.props.progress || 0));
        
        return html`
            <div class="progress-bar-memphis" style="${this.props.style || ''}">
                <div class="progress-fill-memphis" style="width: ${progress}%"></div>
            </div>
        `;
    }
}