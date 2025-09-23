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
        const segmentWidth = 100 / totalSegments; 

        const racerElem = document.createElement('div');
        racerElem.className = 'racer';
        racerElem.id = 'racer' + racerID;
        racerElem.style.width = `${segmentWidth}%`; 

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
        racerSmokeEle.className = 'air';

        racerElem.appendChild(racerSmokeEle);
        racerElem.appendChild(racerEndurance);
        racerElem.appendChild(racerInner);

        return racerElem;
    }

    static createRacerGuiElement(racerId, index) {
        const thisRacer = gameState.racers[racerId];

        const card = document.createElement('div');
        card.className = 'racer-card';
        card.setAttribute('data-racer-id', thisRacer.id);

        // Set CSS custom properties for colors
        const primaryColor = racerColors[thisRacer.colors[0]];
        const secondaryColor = racerColors[thisRacer.colors[1]];
        const tertiaryColor = racerColors[thisRacer.colors[2]];
        
        card.style.setProperty('--primary-color', primaryColor);
        card.style.setProperty('--primary-color-dark', shadeColor(primaryColor, -20));
        card.style.setProperty('--secondary-color', secondaryColor);

        if (typeof index === 'number') {
            const placing = document.createElement('div');
            placing.className = 'placing-badge';
            placing.textContent = index + 1;
            card.appendChild(placing);
        }

        const num = document.createElement('div');
        num.className = 'racer-number';
        num.textContent = thisRacer.id;
        num.style.backgroundColor = tertiaryColor;
        card.appendChild(num);

        const info = document.createElement('div');
        info.className = 'racer-info';
        const name = document.createElement('div');
        name.className = 'racer-name';
        name.textContent = getRacerNameString(thisRacer);
        info.appendChild(name);

        // racer-flag removed — colors still applied to card via CSS variables and number swatch

        card.appendChild(info);
        return card;
    }

    static updateTrackDetails() {
        document.getElementById("trackNameDisplay").innerHTML = gameState.currentRace.trackName;
        document.getElementById("weatherDisplay").innerHTML = gameState.currentRace.weather;
    }
}