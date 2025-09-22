class DOMUtils {
    static createLane(racerId, sections, segmentsPerSection) {
        const lane = document.createElement('div');
        lane.className = 'lane';
        lane.id = 'laneRacer' + racerId;

        sections.forEach(sectionType => {
            for (let k = 0; k < segmentsPerSection; k++) {
                const segment = document.createElement('div');
                segment.className = 'segment groundType' + sectionType;
                lane.appendChild(segment);
            }
        });
		const finishLineSegment = document.createElement('div');
		finishLineSegment.className = 'segment finishLine';
		lane.appendChild(finishLineSegment);

        return lane;
    }

	static createRacerElement(racer, racerID, namePrefix, nameSuffix, totalSegments) {
        const segmentWidth = 100 / totalSegments; // Assuming totalSegments is passed in and the lane width is 100%

        const racerElem = document.createElement('div');
        racerElem.className = 'racer';
        racerElem.id = 'racer' + racerID;
        racerElem.style.width = `${segmentWidth}%`; // Set the width based on segment width
		
		racerElem.classList.add("startingLine");

        const racerEndurance = document.createElement('div');
        racerEndurance.className = 'remainingEndurance';

        const racerInner = document.createElement('div');
        racerInner.className = 'racerInner';

        const racerIDElem = document.createElement('div');
        racerIDElem.className = 'racerID';
        racerIDElem.innerHTML = racerID;

        const racerNameContainer = document.createElement('div');
        racerNameContainer.className = 'racerNameContainer';

        const racerName = document.createElement('div');
        racerName.className = 'racerName';
        racerName.innerHTML = namePrefix + ' ' + nameSuffix;

        racerNameContainer.appendChild(racerIDElem);
        racerNameContainer.appendChild(racerName);

        const racerStripe1 = document.createElement('div');
        racerStripe1.className = 'racerStripe racerStripe1 racerColor' + racer.colors[0];
        const racerStripe2 = document.createElement('div');
        racerStripe2.className = 'racerStripe racerStripe2 racerColor' + racer.colors[1];
        const racerStripe3 = document.createElement('div');
        racerStripe3.className = 'racerStripe racerStripe3 racerColor' + racer.colors[2];

        racerInner.appendChild(racerNameContainer);
        racerInner.appendChild(racerStripe1);
        racerInner.appendChild(racerStripe2);
        racerInner.appendChild(racerStripe3);
		
		
		const racerSmokeEle = document.createElement('div');
		// racerSmokeEle.className = 'smoke';
		racerSmokeEle.className = 'air';
		
		racerElem.appendChild(racerSmokeEle);
        racerElem.appendChild(racerEndurance);
        racerElem.appendChild(racerInner);

        return racerElem;
    }
	
	static createRacerGuiElement(racerId, index) {
		const thisRacer = gameState.racers[racerId];
		if (!index || index === null || index < 0) {
			index = 0;
		}
		
		const newPlaceItem = document.createElement('div');
		newPlaceItem.className = 'historyRacerPlacingContainer';

		const placingContainerBackground = document.createElement('div');
		placingContainerBackground.className = 'placingContainerBackground';

		const racerStripe1 = document.createElement('div');
		racerStripe1.className = 'racerStripe racerStripe1 racerColor' + thisRacer.colors[0];

		const racerStripe2 = document.createElement('div');
		racerStripe2.className = 'racerStripe racerStripe2 racerColor' + thisRacer.colors[1];

		const racerStripe3 = document.createElement('div');
		racerStripe3.className = 'racerStripe racerStripe3 racerColor' + thisRacer.colors[2];

		placingContainerBackground.appendChild(racerStripe1);
		placingContainerBackground.appendChild(racerStripe2);
		placingContainerBackground.appendChild(racerStripe3);

		const newPlaceItemPlacingContainer = document.createElement('div');
		newPlaceItemPlacingContainer.className = 'historyRacerPlacing';
		newPlaceItemPlacingContainer.textContent = index + 1;

		const newPlaceItemNameContainer = document.createElement('div');
		newPlaceItemNameContainer.className = 'racerName';
		newPlaceItemNameContainer.textContent = 
			racerNamePrefixes[thisRacer.name[0]] + ' ' + racerNameSuffixes[thisRacer.name[1]];

		const newPlaceItemIdContainer = document.createElement('div');
		newPlaceItemIdContainer.className = 'historyRacerId';
		newPlaceItemIdContainer.textContent = thisRacer.id;

		newPlaceItem.appendChild(placingContainerBackground);
		newPlaceItem.appendChild(newPlaceItemPlacingContainer);
		newPlaceItem.appendChild(newPlaceItemNameContainer);
		newPlaceItem.appendChild(newPlaceItemIdContainer);

		return newPlaceItem;
	}
	
	static updateTrackDetails() {
		document.getElementById("trackNameDisplay").innerHTML = gameState.currentRace.trackName;
		document.getElementById("weatherDisplay").innerHTML = gameState.currentRace.weather;
	}
}