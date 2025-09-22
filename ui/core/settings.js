
```javascript
function updateSetting(settingName, value) {
    const keys = settingName.split('.');
    let currentSetting = gameState.settings;

    for (let i = 0; i < keys.length - 1; i++) {
        if (!currentSetting.hasOwnProperty(keys[i])) {
            currentSetting[keys[i]] = {};
        }
        currentSetting = currentSetting[keys[i]];
    }

    currentSetting[keys[keys.length - 1]] = parseFloat(value) || value;
    SettingsPanel.refresh();
}

function updateSettingsFromInputs() {
    for (let key in settings) {
        let inputElement = document.getElementById(key);
        if (inputElement) {
            updateSetting(key, inputElement.value);
        }
    }
}

function togglePlayPause() {
    if (gameState.isPaused == false) {
        console.log("trying to pause");
        gameState.setPaused = true;
    }
    if (gameState.isPaused == true) {
        console.log("trying to unpause");
        gameState.setPaused = false;
        gameLoop();
    }

    SettingsPanel.refresh();
}

window.updateSetting = updateSetting;
window.updateSettingsFromInputs = updateSettingsFromInputs;
window.togglePlayPause = togglePlayPause;