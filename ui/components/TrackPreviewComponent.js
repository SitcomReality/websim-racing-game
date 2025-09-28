import { BaseComponent } from './BaseComponent.js';

export class TrackPreviewComponent extends BaseComponent {
    constructor(container, options = {}) {
        super(container, options);
        this.track = null;
        this.raceData = {
            raceIndex: options.raceIndex || 0
        };
    }

    initialize() {
        super.initialize();
    }

    setTrackData(track, raceData = {}) {
        this.track = track;
        this.raceData = { ...this.raceData, ...raceData, showWeather: this.options.showWeather === true };
        if (this.element) {
             this.render();
        }
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.render();
        return this.element;
    }


    render() {
        if (!this.track || !this.element) {
            this.element.innerHTML = '<div class="track-preview-placeholder">No track data available</div>';
            return;
        }

        const participants = this.raceData.participants ? this.raceData.participants.length : 0;
        const groundTypesList = [...new Set(this.track.sections)];
        const numberOfSections = this.track.sections.length;
        
        // Only show a concise surface list and a centered visual preview
        const sectionsHtml = this.renderTrackSections();

        this.element.className = 'track-preview-memphis';
        this.element.innerHTML = `
            ${this.raceData.showWeather && this.raceData.weather ? `<div class="weather-badge-memphis">${String(this.raceData.weather).toUpperCase()}</div>` : ''}
            <h3 class="track-title-memphis">
                <span class="track-name-display">${this.track.name || 'Unknown Track'}</span>
            </h3>
            
             <div class="track-info-summary-memphis">
                <div class="track-info-label-memphis">Surfaces:</div>
                <div class="track-info-value-memphis">${groundTypesList.join(', ')}</div>
             </div>

             <div class="track-visual-memphis track-sections-visual">
                 <div class="track-path-container">${sectionsHtml}</div>
             </div>
            
             <div class="participant-count-memphis">
                 ${participants} Racers
             </div>
         `;

        this.addInteractivity();
    }
    
    renderTrackSections() {
        if (!this.track?.sections) return '';
        
        // Generate a colored block for each section
        const sections = this.track.sections;
        let html = '';
        
        sections.forEach((type, index) => {
            // Use legacy track CSS classes for ground type colors
            const groundTypeClass = `groundType${type}`; 
            
            // Render one block per section.
            html += `<div class="track-section-block ${groundTypeClass}" title="${type}"></div>`;
        });
        
        return html;
    }

    addInteractivity() {
        const trackElement = this.element.querySelector('.track-preview-memphis');
        if (!trackElement) return;

        trackElement.addEventListener('mouseenter', () => {
            trackElement.style.transform = 'translateY(-2px)';
            trackElement.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
        });

        trackElement.addEventListener('mouseleave', () => {
            trackElement.style.transform = 'translateY(0)';
            trackElement.style.boxShadow = 'none';
        });

        trackElement.addEventListener('click', () => {
            this.onTrackSelect();
        });
    }

    onTrackSelect() {
        if (this.options.onSelect && typeof this.options.onSelect === 'function') {
            this.options.onSelect(this.track, this.raceData);
        }
    }

    refresh() {
        this.render();
    }
}