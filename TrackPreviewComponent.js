import { BaseComponent } from './BaseComponent.js';

export class TrackPreviewComponent extends BaseComponent {
    constructor(container, options = {}) {
        super(container, options);
        this.track = null;
        this.raceData = null;
    }

    initialize() {
        super.initialize();
        this.render();
    }

    setTrackData(track, raceData = {}) {
        this.track = track;
        this.raceData = raceData;
        this.render();
    }

    render() {
        if (!this.track) {
            this.element.innerHTML = '<div class="track-preview-placeholder">No track data available</div>';
            return;
        }

        const weatherIcon = this.getWeatherIcon(this.raceData.weather || 'clear');
        const participantCount = this.raceData.participants ? this.raceData.participants.length : 0;
        const groundType = this.track.groundType || 'dirt';

        this.element.innerHTML = `
            <div class="track-preview-memphis">
                <div class="weather-indicator-memphis">${weatherIcon}</div>
                
                <h3 class="track-title-memphis">${this.track.name || 'Unknown Track'}</h3>
                
                <div class="track-visual-memphis">
                    <div class="track-path-memphis"></div>
                </div>
                
                <div class="track-info-grid-memphis">
                    <div class="track-info-item-memphis">
                        <div class="track-info-label-memphis">Length</div>
                        <div class="track-info-value-memphis">${this.track.length || 800}m</div>
                    </div>
                    <div class="track-info-item-memphis">
                        <div class="track-info-label-memphis">Surface</div>
                        <div class="track-info-value-memphis">${groundType}</div>
                    </div>
                    <div class="track-info-item-memphis">
                        <div class="track-info-label-memphis">Difficulty</div>
                        <div class="track-info-value-memphis">${this.getDifficultyLevel()}</div>
                    </div>
                </div>
                
                <div class="participant-count-memphis">
                    ${participantCount} Racers
                </div>
            </div>
        `;

        this.addInteractivity();
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

    getWeatherIcon(weather) {
        const weatherIcons = {
            'clear': '☀️',
            'sunny': '☀️',
            'cloudy': '☁️',
            'rainy': '🌧️',
            'stormy': '⛈️',
            'windy': '💨',
            'foggy': '🌫️'
        };
        return weatherIcons[weather] || '☀️';
    }

    getDifficultyLevel() {
        if (!this.track) return 'Normal';
        
        const length = this.track.length || 800;
        const groundType = this.track.groundType || 'dirt';
        
        let difficulty = 'Normal';
        
        if (length > 1000) {
            difficulty = 'Hard';
        } else if (length < 600) {
            difficulty = 'Easy';
        }
        
        if (groundType === 'mud' || groundType === 'ice') {
            difficulty = difficulty === 'Easy' ? 'Normal' : 'Hard';
        }
        
        return difficulty;
    }

    refresh() {
        this.render();
    }
}

