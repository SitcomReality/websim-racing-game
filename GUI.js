/*

	Functions to set up the GUI

*/


function updateSetting(settingName, value) {
    // Split settingName into an array of keys
    const keys = settingName.split('.');

    // Reference to the settings object
    let currentSetting = gameState.settings;

    // Traverse the object to reach the nested property
    for (let i = 0; i < keys.length - 1; i++) {
        if (!currentSetting.hasOwnProperty(keys[i])) {
            // If the nested property doesn't exist, create it as an empty object
            currentSetting[keys[i]] = {};
        }
        // Move to the next level of nesting
        currentSetting = currentSetting[keys[i]];
    }

    // Assign the value to the nested property
    currentSetting[keys[keys.length - 1]] = value;

    // Call any necessary refresh function
    refreshParametersPanel();
}

// Dynamically update settings based on input element IDs
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
	
	refreshParametersPanel();
}


	
function generateSettingsHTML() {
  let html = '<div id="settingsPanelInner">';
  let tabCount = 0;

  // Recursive function to generate HTML for nested categories
  function generateCategoryHTML(categoryObj, parentKey = '') {
    for (let key in categoryObj) {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      const value = categoryObj[key];
	  const terms = fullKey.split('.');
	  const finalTerm = terms[terms.length - 1];
      if (typeof value === 'object') {
        // Handle nested categories
        html += `<div class="ui-section">`;
        html += `<h3 class="category-toggle">${finalTerm}</h3>`;
        generateCategoryHTML(value, fullKey);
        html += `</div>`;
      } else {
        // Handle leaf settings
        html += `<div class="ui-item">
                   <label for="${fullKey}">${finalTerm}:</label>
                   <input class="settings-input" type="number" id="${fullKey}" value="${value}" step="1" autocomplete="off" onchange="updateSetting('${fullKey}', this.value)" tabindex="${tabCount}">
                 </div>`;
        tabCount++;
      }
    }
  }

  generateCategoryHTML(gameState.settings);
  html += '</div>';
  document.getElementById('initButtonContainer').style = "display: block";
  return html;
}
/*
function updateSetting(key, value) {
  // Parse the key to extract category and sub-category
  const [category, subCategory] = key.split('.');
  settings[category][subCategory] = parseInt(value);
  // Additional logic to handle the updated setting
}
*/
const EventTargetPrototype = document.__proto__.__proto__.__proto__.__proto__;
const origAddEventListener = EventTargetPrototype.addEventListener;
EventTargetPrototype.addEventListener = function addEventListenerWrapper(type, listener) {
    if (typeof listener !== 'function') throw new Error('bad listener for ' + type);
    return origAddEventListener.apply(this, arguments);
};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the game
    document.getElementById('initGame').addEventListener('click', initGame);
	
	// Start a new week
    document.getElementById('startRaceWeek').addEventListener('click', function() {
		this.disabled = true;
		document.getElementById('setupRace').disabled = false;
		createNewRaceWeek();
	});

    // Setup race and setup betting options when setupRace is clicked
    document.getElementById('setupRace').addEventListener('click', function() {
        setupRace();
        setupBettingOptions();
    });

    // Start race when button is clicked
    document.getElementById('startRace').addEventListener('click', startRace);

    // Place a bet when button is clicked
    document.getElementById('placeBet').addEventListener('click', function() {
        const selectedRacerIndex = parseInt(document.getElementById('selectRacer').value);
        const betAmount = parseInt(document.getElementById('betAmount').value);
        placeBet(selectedRacerIndex, betAmount);
    });
	
	// DEBUG STUFF:
	
	// End the race early:
    document.getElementById('endRace').addEventListener('click', function() {
        endRaceEarly();
    });
	
	// Change speed multiplier
    document.getElementById('speedMultiplier').addEventListener('change', function() {
        gameState.settings.racerProperties.speedMultiplier = document.getElementById('speedMultiplier').value;
    });
	
	refreshParametersPanel();
});

function refreshParametersPanel() {
    document.getElementById('introSettings').innerHTML = generateSettingsHTML();
	
	// Hide/unhide settings menu
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