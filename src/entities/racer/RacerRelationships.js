/** 
 * RacerRelationships - Rivalries and friendships affecting performance
 */
export class RacerRelationships {
  constructor(racer, config) {
    this.racer = racer;
    this.config = config;
    this.relationships = new Map();
    this.relationshipHistory = [];
    this.relationshipDecayRate = 0.01;
    this.maxRelationships = 8;
  }

  initializeRelationships(allRacers) {
    // Initialize relationships with random values
    allRacers.forEach(otherRacer => {
      if (otherRacer.id !== this.racer.id) {
        // Generate initial relationship (-1 to 1, negative = rivalry, positive = friendship)
        const baseRelationship = (Math.random() - 0.5) * 2;
        this.relationships.set(otherRacer.id, {
          value: baseRelationship,
          intensity: Math.abs(baseRelationship),
          type: baseRelationship > 0 ? 'friendship' : 'rivalry',
          duration: 0,
          interactions: 0
        });
      }
    });
  }

  updateRelationship(otherRacerId, interactionType, intensity = 1.0) {
    const relationship = this.relationships.get(otherRacerId);
    if (!relationship) return;

    const oldValue = relationship.value;
    let change = 0;

    switch (interactionType) {
      case 'race_together':
        change = (Math.random() - 0.5) * 0.1 * intensity;
        break;
      case 'beat_in_race':
        if (relationship.type === 'rivalry') {
          change = -0.15 * intensity; // Rivalry intensifies
        } else {
          change = -0.05 * intensity; // Friendship weakens
        }
        break;
      case 'lose_to_in_race':
        if (relationship.type === 'rivalry') {
          change = 0.1 * intensity; // Rivalry might soften
        } else {
          change = 0.05 * intensity; // Friendship strengthens
        }
        break;
      case 'stumble_nearby':
        if (relationship.type === 'friendship') {
          change = 0.08 * intensity; // Empathy
        }
        break;
      case 'boost_together':
        if (relationship.type === 'friendship') {
          change = 0.12 * intensity; // Shared excitement
        }
        break;
    }

    relationship.value = Math.max(-1, Math.min(1, relationship.value + change));
    relationship.intensity = Math.abs(relationship.value);
    relationship.type = relationship.value > 0 ? 'friendship' : 'rivalry';
    relationship.interactions++;
    relationship.duration++;

    // Record significant relationship changes
    if (Math.abs(change) > 0.05) {
      this.relationshipHistory.push({
        otherRacerId: otherRacerId,
        oldValue: oldValue,
        newValue: relationship.value,
        interactionType: interactionType,
        timestamp: Date.now()
      });
    }
  }

  getRelationshipEffect(otherRacerId) {
    const relationship = this.relationships.get(otherRacerId);
    if (!relationship) return 1.0;

    // Calculate effect based on relationship type and intensity
    let effect = 1.0;
    
    if (relationship.type === 'friendship') {
      effect = 1 + (relationship.intensity * 0.15); // Up to 15% bonus
    } else if (relationship.type === 'rivalry') {
      effect = 1 - (relationship.intensity * 0.1); // Up to 10% penalty
    }

    return Math.max(0.8, Math.min(1.2, effect));
  }

  getMotivationBonus() {
    // Strong relationships provide motivation bonuses
    let totalBonus = 1.0;
    
    this.relationships.forEach(relationship => {
      if (relationship.intensity > 0.7) {
        if (relationship.type === 'friendship') {
          totalBonus += 0.05;
        } else if (relationship.type === 'rivalry') {
          totalBonus += 0.08; // Rivalries are more motivating
        }
      }
    });

    return Math.min(1.3, totalBonus);
  }

  getRelationshipStatus(otherRacerId) {
    const relationship = this.relationships.get(otherRacerId);
    if (!relationship) return null;

    return {
      value: relationship.value,
      intensity: relationship.intensity,
      type: relationship.type,
      interactions: relationship.interactions,
      duration: relationship.duration
    };
  }

  getStrongestRelationships(limit = 3) {
    const sorted = Array.from(this.relationships.entries())
      .sort((a, b) => b[1].intensity - a[1].intensity)
      .slice(0, limit);

    return sorted.map(([racerId, relationship]) => ({
      racerId: racerId,
      value: relationship.value,
      intensity: relationship.intensity,
      type: relationship.type
    }));
  }

  getRelationshipSummary() {
    const friendships = Array.from(this.relationships.values())
      .filter(r => r.type === 'friendship').length;
    const rivalries = Array.from(this.relationships.values())
      .filter(r => r.type === 'rivalry').length;
    const strongRelationships = Array.from(this.relationships.values())
      .filter(r => r.intensity > 0.7).length;

    return {
      totalRelationships: this.relationships.size,
      friendships: friendships,
      rivalries: rivalries,
      strongRelationships: strongRelationships,
      averageIntensity: this.getAverageIntensity()
    };
  }

  getAverageIntensity() {
    if (this.relationships.size === 0) return 0;
    
    const totalIntensity = Array.from(this.relationships.values())
      .reduce((sum, relationship) => sum + relationship.intensity, 0);
    
    return totalIntensity / this.relationships.size;
  }

  decayRelationships() {
    this.relationships.forEach(relationship => {
      // Relationships naturally decay over time
      relationship.value *= (1 - this.relationshipDecayRate);
      relationship.intensity = Math.abs(relationship.value);
      
      // Update type based on new value
      relationship.type = relationship.value > 0 ? 'friendship' : 'rivalry';
    });
  }

  serialize() {
    const relationships = {};
    this.relationships.forEach((relationship, racerId) => {
      relationships[racerId] = {
        value: relationship.value,
        intensity: relationship.intensity,
        type: relationship.type,
        interactions: relationship.interactions,
        duration: relationship.duration
      };
    });

    return {
      relationships: relationships,
      relationshipHistory: [...this.relationshipHistory],
      relationshipDecayRate: this.relationshipDecayRate
    };
  }

  reset() {
    this.relationships.clear();
    this.relationshipHistory = [];
    this.relationshipDecayRate = 0.01;
  }
}