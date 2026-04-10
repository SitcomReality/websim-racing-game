/**
 * TrackManager - Handles track creation and management
 */
export class TrackManager {
  constructor(options = {}) {
    this.segmentsPerSection = options.segmentsPerSection || 3;
  }

  createLane(racerId, sections) {
    const lane = document.createElement('div');
    lane.className = 'lane';
    lane.id = 'laneRacer' + racerId;

    sections.forEach(sectionType => {
      for (let k = 0; k < this.segmentsPerSection; k++) {
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

  createRacerElement(racer, racerID, namePrefix, nameSuffix, totalSegments) {
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

  updateTrackDetails(track, weather) {
    const trackNameDisplay = document.getElementById("trackNameDisplay");
    const weatherDisplay = document.getElementById("weatherDisplay");
    
    if (trackNameDisplay && track) {
      trackNameDisplay.innerHTML = track.name;
    }
    
    if (weatherDisplay && weather) {
      weatherDisplay.innerHTML = weather;
    }
  }
}

