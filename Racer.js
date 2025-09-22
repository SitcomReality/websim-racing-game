class Racer {
    constructor(id, name, colors) {
        this.id = id;
		this.name = name;
		this.colors = colors;
		this.isExhausted = false;
		this.isBoosting = false;
		this.currentForm = 1;
		this.remainingEndurance = this.endurance;
		this.remainingBoost = this.boostDuration;
		this.remainingStumble = 0;
		this.history = [];
		this.performance = [];
		this.performanceHistory = [];
		this.speedHistory = [];
		this.speedThisRace = [];
		this.baseBettingOdds = 1.5;
		this.generateStats();
		this.shadowDistance = 0;
    }
	
	generateStats() {
        this.stats = this.initStats();
        this.compensateStats();
    }
	
    initStats() {
        const stats = {};
        // Generate base stats
        const baseStats = ['endurance', 'exhaustionMultiplier', 'boostPower', 'boostDuration', 'stumbleChance', 'stumbleDuration'];
        baseStats.forEach((statName) => {
            const base = gameState.settings.racerProperties[`${statName}Base`];
            const variance = gameState.settings.racerProperties[`${statName}Variance`];
            stats[statName] = getRandomValue(base, variance); // Random value within range
			//console.log("[Base: "+base+"] [Variance: "+variance+"] [statName: "+statName+"] [stats[statName]: "+stats[statName]+"]");
        });

        // Add weather stats
        stats.weather = {};
        const weatherTypes = gameState.settings.worldProperties.weatherTypes;
        weatherTypes.forEach((weatherType) => {
            const base = gameState.settings.weatherProperties[`${weatherType}Base`];
            const variance = gameState.settings.weatherProperties[`${weatherType}Variance`];
            stats.weather[weatherType] = getRandomValue(base, variance);
        });

        // Add ground stats
        stats.ground = {};
        const groundTypes = gameState.settings.worldProperties.groundTypes;
        groundTypes.forEach((groundType) => {
            const base = gameState.settings.groundProperties[`${groundType}Base`];
            const variance = gameState.settings.groundProperties[`${groundType}Variance`];
            stats.ground[groundType] = getRandomValue(base, variance);
        });
		
		stats.third = {};
		const thirdTypes = gameState.settings.worldProperties.thirdTypes;
        thirdTypes.forEach((thirdType) => {
            const base = gameState.settings.thirdProperties[`${thirdType}Base`];
            const variance = gameState.settings.thirdProperties[`${thirdType}Variance`];
            stats.third[thirdType] = getRandomValue(base, variance);
        });
		stats.formVariation = getRandomValue(gameState.settings.racerProperties.formVariationBase, gameState.settings.racerProperties.formVariationVariance);
        return stats;
    }

    getRandomCompensationRule(stats, count = 2) {
        const statNames = Object.keys(stats).filter(statName => typeof stats[statName] === 'number'); // Filter out nested objects like weather and ground
        const randomStats = [];
        // Pick random stats
        while (randomStats.length < count) {
            const randomStat = statNames[Math.floor(Math.random() * statNames.length)];
            if (!randomStats.includes(randomStat)) {
                randomStats.push(randomStat);
            }
        }
        return randomStats;
    }
    compensateStats() {
        const statsToCompensate = {
           // general: ['endurance', 'exhaustionMultiplier', 'boostPower', 'boostDuration', 'stumbleChance', 'stumbleDuration'],
            weather: gameState.settings.worldProperties.weatherTypes,
            ground: gameState.settings.worldProperties.groundTypes,
			third: gameState.settings.worldProperties.thirdTypes
        };
        //this.applyCompensation(this.stats, gameState.settings.racerProperties, statsToCompensate.general);
        this.applyCompensation(this.stats.weather, gameState.settings.weatherProperties, statsToCompensate.weather);
        this.applyCompensation(this.stats.ground, gameState.settings.groundProperties, statsToCompensate.ground);
		this.applyCompensation(this.stats.third, gameState.settings.thirdProperties, statsToCompensate.third);
    }

    applyCompensation(stats, properties, statNames) {
        const compensationProbability = gameState.settings.racerProperties.compensationStatBoostTwoStatsChance;
        statNames.forEach((statName) => {
            if (stats[statName] !== undefined) {
                const base = properties[`${statName}Base`];
                const variance = properties[`${statName}Variance`];
                const threshold = base - (variance * gameState.settings.compensationThreshold); // Use a generic compensation threshold
                if (stats[statName] <= threshold) {
                    const compensationCount = Math.random() < compensationProbability ? 2 : 1;
                    const compensationStats = this.getRandomCompensationRule(stats, compensationCount);
                    compensationStats.forEach(compensatedStat => {
                        if (stats[compensatedStat] !== undefined) {
                            const randomBoostPercentage = getRandomInt(gameState.settings.racerProperties.compensationStatBoostMin * 100, gameState.settings.racerProperties.compensationStatBoostMax * 100) / 100;
							const boostAmount = truncateToDecimals(randomBoostPercentage * properties[`${compensatedStat}Base`], 3);
							stats[compensatedStat] += boostAmount;
							//console.log("Racer #" + this.id + " had poor " + statName + ", received +" + boostAmount + " " + compensatedStat);
                        }
                    });
                }
            }
        });
    }
	
	reset() {
        this.remainingEndurance = this.stats.endurance;
        this.remainingBoost = this.stats.boostDuration;
        this.isBoosting = false;
        this.isExhausted = false;
        this.remainingStumble = 0; // Assume racer's not stumbling initially
        this.generateBaseBettingOdds();
		this.speedThisRace = [];
		this.shadowDistance = 0;
    }
	
    /**
     * Calculates the racer's speed based on various factors.
     * @param {number} racerForm - Racer's form value. A random number generated each week between 0 and this.formVariation
     * @param {boolean} isExhausted - Whether the racer is exhausted.
     * @param {boolean} isBoosting - Whether the racer currently has boost active.
     * @param {number} percentRaceComplete - Percentage of the race completed.
     * @param {string} groundType - Type of ground (e.g., "asphalt", "dirt").
     * @param {string} weatherType - Type of weather (e.g., "sunny", "rainy").
     * @returns {number} Calculated speed.
     */
    calculateSpeed(racerForm, percentRaceComplete, groundType, weatherType) {
        let returnSpeed = gameState.settings.racerProperties.speedBase;
        returnSpeed *= this.stats.ground[groundType] || 1;
        returnSpeed *= this.stats.weather[weatherType] || 1;
        const currentThird = percentRaceComplete < 34 ? 1 : percentRaceComplete > 66 ? 3 : 2;
		let thirdName = "one";
		if (currentThird === 2) { thirdName = "two" }
		if (currentThird === 3) { thirdName = "three" }
        returnSpeed *= this.stats.third[thirdName];
		returnSpeed *= racerForm;
        if (this.isExhausted) {
            returnSpeed *= this.stats.exhaustionMultiplier;
        }
        if (this.isBoosting) {
            returnSpeed += this.stats.boostPower;
        }
		returnSpeed = truncateToDecimals(returnSpeed * gameState.settings.racerProperties.speedMultiplier, 4);
		if (this.speedThisRace[this.speedThisRace.length - 1] != returnSpeed) {
			this.speedThisRace.push(returnSpeed);
		}
        return returnSpeed;
    }
	getAverageSpeed() {
        const totalSpeed = this.speedThisRace.reduce((accumulator, speed) => accumulator + speed, 0);
        return totalSpeed / this.speedThisRace.length;
    }
	
	activateBoost() {
		this.isBoosting = true;
	}
	deactivateBoost() {
		this.isBoosting = false;
	}
	reduceRemainingBoost(reduction) {
		this.remainingBoost = this.remainingBoost - reduction;
	}
	
	reduceRemainingEndurance(reduction) {
		this.remainingEndurance = this.remainingEndurance - reduction;
	}
	makeExhausted() {
		this.remainingEndurance = 0;
		this.isExhausted = true;
	}
	
	updateRacerHistory(raceid, finishingPosition) {
		this.history.push([raceid, finishingPosition]);
	}
	
	getAverageFinishingPosition(numberOfRaces) {
		let sum = 0;
		let count = 0;
		// Calculate the number of races to consider for the average
		const racesToConsider = Math.min(numberOfRaces, this.history.length);
		// Sum all finishing positions for the 'racesToConsider' number of recent races
		for (let i = 0; i < racesToConsider; i++) {
			sum += this.history[i][1];  // the finishing position is the second element
			count++;
		}
		// Calculate the average. If count is 0 (ideally never the case here), return 0 to avoid division by zero
		const averageFinishingPosition = count > 0 ? sum / count : 0;
		return averageFinishingPosition;
	}
	
	getFavoredConditions() {
        let favorite = { condition: null, winRate: 0 };
        
        for(let condition in this.performance) {
            let stats = this.performance[condition];
            let winRate = stats.wins / stats.races;
            
            if(favorite.condition === null || winRate > favorite.winRate) {
                favorite = { condition, winRate };
            }
        }
        
        return favorite.condition;
    }
	
	getFormGuide() {
			let favoredCondition = this.getFavoredConditions();
			let averageSpeed = this.speed.reduce((a, b) => a + b, 0) / this.speed.length;
			return {
				name: this.name,
				totalWins: this.wins,
				averageSpeed: averageSpeed.toFixed(2),
				favoredCondition: favoredCondition
			};
	}
	
	compareToBaseline() {
		baseline = gameState.racerPerformance.baseline;
		let guide = this.getFormGuide();
		return {
			...guide,
			aboveAverageWins: guide.totalWins > baseline.averageWins,
			aboveAverageSpeed: guide.averageSpeed > baseline.averageSpeed
		};
	}
	
    addRaceResult(condition, speed, result) {
        if(!this.performance[condition]) {
            this.performance[condition] = {
                totalSpeed: 0,
                races: 0,
                wins: 0
            }
        }
        
        this.performance[condition].totalSpeed += speed;
        this.performance[condition].races += 1;
        
        if(result === 'win') {
            this.performance[condition].wins += 1;
            this.wins += 1;
        }

        this.performanceHistory.push({ condition, speed, result });
        this.speedHistory.push(speed);
    }	
	generateBaseBettingOdds() {
	  const { history, getAverageFinishingPosition } = this;
	  const { numberOfLanes } = gameState.settings.trackProperties;
	  // If the racer has no race history, set base odds to 1/numberOfLanes (equal odds)
	  if (history.length === 0) {
		return 1 / numberOfLanes;
	  }
	  // Calculate the average finishing position over the last 5 races
	  const averageFinishingPosition = this.getAverageFinishingPosition(Math.min(5, history.length));
	  // Calculate the base odds based on the average finishing position
	  let baseOdds = averageFinishingPosition / numberOfLanes;
	  
	  //if (averageFinishingPosition > 3) {
		  baseOdds = baseOdds + (averageFinishingPosition / gameState.settings.bettingProperties.winningCalculationModifier);
	  //}
	  
		this.baseBettingOdds = 1 + truncateToDecimals(Math.max(gameState.settings.bettingProperties.minOdds, Math.min(gameState.settings.bettingProperties.maxOdds, baseOdds)),3);
	  return this.baseBettingOdds;
	}
	
	generateWinningPayout(betValue) {
	  const { baseBettingOdds } = this;
	  // Check if baseBettingOdds is defined and a valid number
	  if (typeof baseBettingOdds !== 'number' || isNaN(baseBettingOdds) || baseBettingOdds <= 0) {
		throw new Error('Invalid base betting odds for racer with ID ' + this.id);
	  }
	  // Calculate the winning payout based on the bet value and base betting odds
	  const winningPayout = betValue * baseBettingOdds;
	  return truncateToDecimals(winningPayout,2);
	}


}