import { SettingsPanel } from '../components/settingsPanel.js';

/** 
 * IntroScreen - Game introduction and settings screen
 */
export class IntroScreen {
  constructor() {
    this.element = null;
    this.eventBus = null;
    this.settingsPanel = null;
    this.loadingIndicator = null;
  }

  initialize(eventBus) {
    this.eventBus = eventBus;
    this.createElement();
    this.bindEvents();
    this.settingsPanel = new SettingsPanel(this.element.querySelector('#introSettings'), {
      eventBus: this.eventBus
    });
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.id = 'introScreen';
    this.element.innerHTML = `
      <div id="introSettingsContainer">
        <div id="introSettings" class="ui-section"></div>
        <div id="initButtonContainer" class="ui-section">
          <div class="ui-item">
            <button id="initGame" class="btn btn-primary">New Game</button>
            <div id="newGameLoading" class="loading-indicator" style="display: none;">
              <div class="loading-spinner-small"></div>
              <span>Initializing...</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const initButton = this.element.querySelector('#initGame');
    if (initButton) {
      initButton.addEventListener('click', () => {
        this.showLoadingIndicator();
        // Use a short timeout to allow the UI to update before starting the heavy work.
        setTimeout(() => {
            this.eventBus.emit('game:initialize');
        }, 50);
      });
    }

    this.element.addEventListener('change', (e) => {
      if (e.target.classList.contains('settings-input')) {
        const fullKey = e.target.id;
        let value = e.target.value;
        if (e.target.type === 'number' || !isNaN(parseFloat(value))) {
            value = parseFloat(value);
        }
        this.updateSetting(fullKey, value);
        // Prevent tab switch by stopping propagation
        e.stopPropagation();
      }
    });

    this.element.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-toggle')) {
            const category = e.target.parentNode;
            const items = category.querySelectorAll('.ui-item');
            items.forEach(function(item) {
                item.style.display = (item.style.display === 'none') ? 'block' : 'none';
            });
        }
    });
  }

  showLoadingIndicator() {
    const initButton = this.element.querySelector('#initGame');
    const loadingIndicator = this.element.querySelector('#newGameLoading');
    
    if (initButton && loadingIndicator) {
      initButton.disabled = true;
      initButton.style.display = 'none';
      loadingIndicator.style.display = 'flex';
    }
  }

  hideLoadingIndicator() {
    const initButton = this.element.querySelector('#initGame');
    const loadingIndicator = this.element.querySelector('#newGameLoading');
    
    if (initButton && loadingIndicator) {
      loadingIndicator.style.display = 'none';
      initButton.style.display = 'block';
      initButton.disabled = false;
    }
  }

  show(data = {}) {
    (data?.container || document.getElementById('app') || document.body).appendChild(this.element);
    
    // Initialize settings panel if available
    if (this.settingsPanel) {
      this.settingsPanel.refresh(data.gameState);
    }
  }

  hide() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
  
  updateSetting(settingName, value) {
    const keys = settingName.split('.');
    let currentSetting = window.app.gameState.settings;

    for (let i = 0; i < keys.length - 1; i++) {
        if (!currentSetting.hasOwnProperty(keys[i])) {
            currentSetting[keys[i]] = {};
        }
        currentSetting = currentSetting[keys[i]];
    }
    
    currentSetting[keys[keys.length - 1]] = value;
    if (this.settingsPanel) {
        this.settingsPanel.refresh(window.app.gameState);
    }
  }

  cleanup() {
    this.element = null;
    this.eventBus = null;
  }
}