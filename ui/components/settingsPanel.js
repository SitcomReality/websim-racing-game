
```javascript
class SettingsPanel {
    static generateSettingsHTML() {
        let html = '<div id=\"settingsPanelInner\">';
        let tabCount = 0;

        function generateCategoryHTML(categoryObj, parentKey = '') {
            for (let key in categoryObj) {
                const fullKey = parentKey ? `${parentKey}.${key}` : key;
                const value = categoryObj[key];
                const terms = fullKey.split('.');
                const finalTerm = terms[terms.length - 1];
                if (typeof value === 'object') {
                    html += `<div class=\"ui-section\">`;
                    html += `<h3 class=\"category-toggle\">${finalTerm}</h3>`;
                    generateCategoryHTML(value, fullKey);
                    html += `</div>`;
                } else {
                    html += `<div class=\"ui-item\">`;
                    const isGroundType = parentKey.includes('groundProperties');
                    const isWeatherType = parentKey.includes('weatherProperties');
                    const isThirdType = parentKey.includes('thirdProperties');

                    if (isGroundType || isWeatherType || isThirdType) {
                        html += `<label for=\"${fullKey}\">${finalTerm}:</label>`;
                        html += `<input class=\"settings-input\" type=\"text\" id=\"${fullKey}\" value=\"${value}\" autocomplete=\"off\" onchange=\"updateSetting('${fullKey}', this.value)\" tabindex=\"${tabCount}\">`;
                    } else {
                        html += `<label for=\"${fullKey}\">${finalTerm}:</label>`;
                        html += `<input class=\"settings-input\" type=\"number\" id=\"${fullKey}\" value=\"${value}\" step=\"1\" autocomplete=\"off\" onchange=\"updateSetting('${fullKey}', this.value)\" tabindex=\"${tabCount}\">`;
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

    static refresh() {
        document.getElementById('introSettings').innerHTML = SettingsPanel.generateSettingsHTML();

        var categoryToggles = document.querySelectorAll('.category-toggle');

        categoryToggles.forEach(function(toggle) {
            toggle.addEventListener('click', function() {
                var category = toggle.parentNode;
                var items = category.querySelectorAll('.ui-item');
                items.forEach(function(item) {
                    item.style.display = (item.style.display === 'none') ? 'block' : 'none';
                });
            });
        });
    }
}

window.SettingsPanel = SettingsPanel;