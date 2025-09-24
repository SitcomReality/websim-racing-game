/**
 * BettingManager - Core betting system logic
 */
export class BettingManager {
  constructor(eventBus, gameState) {
    this.eventBus = eventBus;
    this.gameState = gameState;
    this.activeBets = new Map();
    this.betHistory = [];
    this.maxBetsPerRace = 10;
  }

  /**
   * Place a new bet
   */
  placeBet(betData) {
    const { type, racerId, amount, raceId } = betData;

    // Validate bet
    if (!this.validateBet(betData)) {
      return false;
    }

    const bet = {
      id: this.generateBetId(),
      type: type,
      racerId: racerId,
      amount: amount,
      raceId: raceId || this.gameState.currentRace?.id,
      timestamp: Date.now(),
      status: 'active',
      potentialPayout: this.calculatePotentialPayout(type, racerId, amount)
    };

    this.activeBets.set(bet.id, bet);

    // Deduct from player balance
    this.gameState.player.balance -= amount;

    this.eventBus.emit('bet:placed', bet);
    return bet;
  }

  /**
   * Validate bet parameters
   */
  validateBet(betData) {
    const { type, racerId, amount } = betData;

    // Check player balance
    if (this.gameState.player.balance < amount) {
      return false;
    }

    // Check minimum bet
    if (amount < 10) {
      return false;
    }

    // Check if racer exists and is in current race
    const racer = this.gameState.racers[racerId];
    if (!racer || !this.gameState.currentRace?.racers.includes(racerId)) {
      return false;
    }

    // Check max bets per race
    const raceBets = Array.from(this.activeBets.values())
      .filter(bet => bet.raceId === this.gameState.currentRace?.id);

    if (raceBets.length >= this.maxBetsPerRace) {
      return false;
    }

    return true;
  }

  /**
   * Calculate potential payout
   */
  calculatePotentialPayout(betType, racerId, amount) {
    const racer = this.gameState.racers[racerId];
    if (!racer) return 0;

    let odds = 1.0;

    switch (betType) {
      case 'win':
        odds = racer.baseBettingOdds || 1.5;
        break;
      case 'quinella':
        // Higher odds for quinella (picking 1st and 2nd)
        odds = (racer.baseBettingOdds || 1.5) * 3;
        break;
      case 'trifecta':
        // Even higher odds for trifecta (picking 1st, 2nd, and 3rd)
        odds = (racer.baseBettingOdds || 1.5) * 8;
        break;
    }

    return Math.round(amount * odds * 100) / 100;
  }

  /**
   * Process race results and settle bets
   */
  settleBets(raceResults) {
    const settledBets = [];

    for (const [betId, bet] of this.activeBets) {
      if (bet.raceId !== this.gameState.currentRace?.id) continue;

      const result = this.evaluateBet(bet, raceResults);

      if (result.won) {
        // Pay out winnings
        this.gameState.player.balance += result.payout;
        bet.status = 'won';
        bet.payout = result.payout;
      } else {
        bet.status = 'lost';
        bet.payout = 0;
      }

      settledBets.push(bet);
      this.activeBets.delete(betId);
      this.betHistory.push(bet);
    }

    this.eventBus.emit('bets:settled', {
      settledBets: settledBets,
      totalWinnings: settledBets.reduce((sum, bet) => sum + (bet.payout || 0), 0)
    });

    return settledBets;
  }

  /**
   * Evaluate if a bet won
   */
  evaluateBet(bet, raceResults) {
    const { type, racerId } = bet;

    switch (type) {
      case 'win':
        const won = raceResults[0] === racerId;
        const payout = won ? bet.potentialPayout : 0;
        return { won, payout };
      case 'quinella':
        const quinellaWon = raceResults.slice(0, 2).includes(racerId);
        const quinellaPayout = quinellaWon ? bet.potentialPayout : 0;
        return { won: quinellaWon, payout: quinellaPayout };
      case 'trifecta':
        const trifectaWon = raceResults.slice(0, 3).includes(racerId);
        const trifectaPayout = trifectaWon ? bet.potentialPayout : 0;
        return { won: trifectaWon, payout: trifectaPayout };
      default:
        return { won: false, payout: 0 };
    }
  }

  /**
   * Get active bets for current race
   */
  getActiveBets(raceId) {
    return Array.from(this.activeBets.values())
      .filter(bet => bet.raceId === raceId);
  }

  /**
   * Get bet history
   */
  getBetHistory(limit = 50) {
    return this.betHistory.slice(-limit);
  }

  /**
   * Get betting statistics
   */
  getBettingStats() {
    const totalBets = this.betHistory.length;
    const wonBets = this.betHistory.filter(bet => bet.status === 'won').length;
    const totalWagered = this.betHistory.reduce((sum, bet) => sum + bet.amount, 0);
    const totalWon = this.betHistory.reduce((sum, bet) => sum + (bet.payout || 0), 0);

    return {
      totalBets: totalBets,
      wonBets: wonBets,
      winRate: totalBets > 0 ? wonBets / totalBets : 0,
      totalWagered: totalWagered,
      totalWon: totalWon,
      profit: totalWon - totalWagered
    };
  }

  /**
   * Generate unique bet ID
   */
  generateBetId() {
    return `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cancel a bet (if allowed)
   */
  cancelBet(betId) {
    const bet = this.activeBets.get(betId);
    if (!bet) return false;

    // Refund the bet amount
    this.gameState.player.balance += bet.amount;
    this.activeBets.delete(betId);

    this.eventBus.emit('bet:cancelled', bet);
    return true;
  }
}