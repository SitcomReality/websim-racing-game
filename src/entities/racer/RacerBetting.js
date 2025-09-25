/**
 * RacerBetting - Handles odds calculation and payout logic
 */
export class RacerBetting {
  constructor(racer, config) {
    this.racer = racer;
    this.config = config;
    this.baseBettingOdds = 1.5;
  }

  generateBaseBettingOdds() {
    // Use bound methods to preserve 'this' context
    const history = this.racer.history;
    const { numberOfLanes } = this.config.trackProperties;

    if (history.length === 0) {
      return 1 / numberOfLanes;
    }

    const averageFinishingPosition = this.racer.getAverageFinishingPosition(Math.min(5, history.length));

    // Calculate the base odds based on the average finishing position
    let baseOdds = averageFinishingPosition / numberOfLanes;

    this.baseBettingOdds = 1 + Math.max(
      this.config.bettingProperties.minOdds, 
      Math.min(this.config.bettingProperties.maxOdds, baseOdds)
    );
    return this.baseBettingOdds;
  }

  generateWinningPayout(betValue) {
    // Check if baseBettingOdds is defined and a valid number
    if (typeof this.baseBettingOdds !== 'number' || isNaN(this.baseBettingOdds) || this.baseBettingOdds <= 0) {
      throw new Error('Invalid base betting odds for racer with ID ' + this.racer.id);
    }

    // Calculate the winning payout based on the bet value and base betting odds
    const winningPayout = betValue * this.baseBettingOdds;
    return Math.trunc(winningPayout * 100) / 100;
  }

  serialize() {
    return {
      baseBettingOdds: this.baseBettingOdds
    };
  }

  reset() {
    this.generateBaseBettingOdds();
  }
}