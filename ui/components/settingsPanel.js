import { BaseComponent } from './BaseComponent.js';

export class SettingsPanel extends BaseComponent {
    constructor(element, options = {}) {
        super(element, options);
        this.gameState = options.gameState;
    }

    static generateSettingsHTML(gameState) {
        let html = '<div id="settingsPanelInner">';
        let tabCount = 0;

        function generateCategoryHTML(categoryObj, parentKey = '') {
            for (let key in categoryObj) {
                const fullKey = parentKey ? `${parentKey}.${key}` : key;
                const value = categoryObj[key];
                const terms = fullKey.split('.');
                const finalTerm = terms[terms.length - 1];
                if (typeof value === 'object') {
                    html += `<div class="ui-section">`;
                    html += `<h3 class="category-toggle">${finalTerm}</h3>`;
                    generateCategoryHTML(value, fullKey);
                    html += `</div>`;
                } else {
                    html += `<div class="ui-item">`;
                    const isGroundType = parentKey.includes('groundProperties');
                    const isWeatherType = parentKey.includes('weatherProperties');
                    const isThirdType = parentKey.includes('thirdProperties');

                    if (isGroundType || isWeatherType || isThirdType) {
                        html += `<label for="${fullKey}">${finalTerm}:</label>`;
                        html += `<input class="settings-input" type="text" id="${fullKey}" value="${value}" autocomplete="off" tabindex="${tabCount}">`;
                    } else {
                        html += `<label for="${fullKey}">${finalTerm}:</label>`;
                        html += `<input class="settings-input" type="number" id="${fullKey}" value="${value}" step="1" autocomplete="off" tabindex="${tabCount}">`;
                    }
                    html += `</div>`;
                    tabCount++;
                }
            }
        }

        generateCategoryHTML(gameState.settings);
        html += '</div>';
        document.getElementById('initButtonContainer').style = "display: block";
        return html;
    }

    static refresh(gameState) {
        if (!gameState) {
            console.error("SettingsPanel.refresh requires gameState.");
            return;
        }
        const settingsContainer = document.getElementById('introSettings');
        if (settingsContainer) {
            settingsContainer.innerHTML = SettingsPanel.generateSettingsHTML(gameState);
        }
    }
}

// Legacy compatibility
window.SettingsPanel = SettingsPanel;