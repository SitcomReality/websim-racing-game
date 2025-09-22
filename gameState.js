let gameState = {
	running: false,
	raceWeekRaceCounter: 0,
	raceWeekCounter: 0,
    settings: {
		compensationThreshold: 0.5, // Compensation threshold as a percentage of variance
		bettingProperties: {
			minOdds: 0.5,
			maxOdds: 15,
			winningCalculationModifier: 1.5,
		},
        trackProperties: {
			numberOfSegments: 21, // deprecated, use minSectionsPerTrack / segmentsPerSection now.
			minConsecutiveSegmentsOfSameType: 1, // deprecated, using sections now
			sequentialSegments: 3, // I think all these are deprecated

			numberOfLanes: 10, // the number of Racers per race

			segmentsPerSection: 3, // segments are smallest units of racetrack, each can have a different groundType
			minSectionsPerTrack: 3, // sprint race
			maxSectionsPerTrack: 7, // endurance race
			
			totalPoolSize: 30, // total number of tracks to generate. All races for the whole game will take place on these tracks.
        },
		weekProperties: {
			numberOfRaces: 5, // each week is comprised of this number of races
			uniqueTracksMin: 3, // use at least this many distinct tracks for the week's races
			uniqueTracksMax: 3, // don't use more unique tracks than this (eg. repeat a track already used this week instead)
			uniqueRacersMin: 20, // get at least this many racers from the pool
			uniqueRacersMax: 35, // this will force some racers to participate in multiple races each week
		},
		racerProperties: {
			numberOfColorsToChooseFrom: 31,
			numberOfColorsPerRacer: 3,
			
			speedBase: 10,
			speedMultiplier: 0.02,
			
			enduranceInitialValueMultiplier: 1, // used to set the enduranceBase at init, based on avg trackLength & avg speed
			
			enduranceDrainMultiplier: 1, // still trying to get the endurance to be a good number to make sense
			
			enduranceBase: 2000, // enduranceRemaining reduces by 1 every frame and leads to Exhaustion when depleted
			enduranceVariance: 200,
			exhaustionMultiplierBase: 0.75, // When endurance is depleted, speed is multiplied by this (after all other speed calculations except boost)
			exhaustionMultiplierVariance: 0.1,
			formVariationBase: 0.05, // How much the racer's speed can vary between race weeks.
			formVariationVariance: 0.02,
			boostPowerBase: 800, // When boost is active, this number is added to racer speed after ALL other calculations (including stumble)
			boostPowerVariance: 100,
			boostDurationBase: 600, // How long boost will last.
			boostDurationVariance: 100,
			
			boostActivationPercentBase: 70, // What percentage of the race is complete before a racer will attempt to start boosting
			boostActivationPercentVariance: 4,
			
			/*
			speedModifierByThirdVariance: 0.02, // 3 separate speed modifiers are generated: one for each third of the track
			speedModifierByGroundVariance: 0.03, // Tracks are comprised of segments of different groundType.
			speedModifierByWeatherVariance: 0, // Each race week/meet will be influenced by a different weatherType.
			*/
			
			stumbleChanceBase: 0.002, // every frame the racer has this chance to stumble
			stumbleChanceVariance: 0.0006,
			
			stumbleDurationBase: 21, // how long will a stumble prevent a racer from moving?
			stumbleDurationVariance: 7,
			
			percentOfLowVarianceForStatBoost: 0.75, // If the Racer's stat value is (Base - (Variance*.75)) then it should trigger some compensation.
			compensationStatBoostMin: 0.05,
			compensationStatBoostMax: 0.15,
			compensationStatBoostTwoStatsChance: 0.2, // The chance that a racer will have two stats boosted when giving compensation
			
			totalPoolSize: 36, // number of racers total
		},
		worldProperties: {
			groundTypes: ["asphalt","gravel","dirt","grass","mud","rock","marble"],
			weatherTypes: ["sunny","rainy","windy","cloudy","dusty","stormy","snowy","foggy"],
			thirdTypes: ["one","two","three"],
		},
		weatherProperties: {
			sunnyBase: 9, sunnyVariance: 0.3,
			rainyBase: 5, rainyVariance: 2.5,
			windyBase: 5, windyVariance: 1.2,
			foggyBase: 7, foggyVariance: 1.6,
			cloudyBase: 6, cloudyVariance: 1.1,
			dustyBase: 5, dustyVariance: 1,
			stormyBase: 4, stormyVariance: 2,
			snowyBase: 3, snowyVariance: 1.2,
		},
		groundProperties: {
			// See above.
			dirtBase: 6, dirtVariance: 1,
			grassBase: 5, grassVariance: 1.2,
			gravelBase: 8, gravelVariance: 3,
			asphaltBase: 10, asphaltVariance: 1.5,
			mudBase: 4, mudVariance: 0.8,
			rockBase: 8, rockVariance: 1,
			marbleBase: 5, marbleVariance: 1,
		},
		thirdProperties: {
			oneBase: 6, oneVariance: 0.2,
			twoBase: 5, twoVariance: 0.3,
			threeBase: 6, threeVariance: 0.6,
		},
    },
    player: {
        balance: 1000,
    },
	tracks: [],
    racers: [],
    currentRace: {
        id: 0,
        racers: [],
		track: [],
		segments: [],
		sections: [],
		weather: [],
		results: [],
        winner: null,
		liveLocations: [],
		livePositions: [],
    },
    raceHistory: [],
	racerPerformance: {
		baseline: {
			averageSpeed: 1,
			averageWins: 0.1,
		},
	},
};