class Track {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        // Generate the number of sections between minSectionsPerTrack and maxSectionsPerTrack
        const numberOfSections = getRandomInt(
            gameState.settings.trackProperties.minSectionsPerTrack,
            gameState.settings.trackProperties.maxSectionsPerTrack
        );
        this.sections = this.generateSections(numberOfSections);
    }

    generateSections(numberOfSections) {
        const groundTypes = gameState.settings.worldProperties.groundTypes;
        const sections = [];
        for (let i = 0; i < numberOfSections; i++) {
            const randomGroundType = getRandomElement(groundTypes);
            sections.push(randomGroundType);
        }
        return sections;
    }
}