/**
 * Torneatron 2000 - Single Elimination / Playoff Bracket Engine
 */

export const EliminationEngine = {
  /**
   * Initializes single elimination bracket structure
   */
  generateBrackets(tournament) {
    const players = [...tournament.players.filter(p => p.active !== false)];
    const numPlayers = players.length;

    // Next power of 2
    let bracketSize = 2;
    while (bracketSize < numPlayers) {
      bracketSize *= 2;
    }

    const totalRounds = Math.log2(bracketSize);
    const rounds = [];

    // Seed players (1 vs N, 2 vs N-1, etc.)
    const seeds = new Array(bracketSize).fill(null);
    players.forEach((p, idx) => {
      seeds[idx] = p.id;
    });

    // Round 1 matches
    const round1Pairings = [];
    for (let i = 0; i < bracketSize / 2; i++) {
      const p1Id = seeds[i];
      const p2Id = seeds[bracketSize - 1 - i];

      round1Pairings.push({
        id: `r1_m${i + 1}`,
        board: i + 1,
        whiteId: p1Id,
        blackId: p2Id,
        result: (p1Id && !p2Id) ? '1-0' : (!p1Id && p2Id) ? '0-1' : null
      });
    }

    rounds.push({
      roundNumber: 1,
      name: this.getRoundName(1, totalRounds),
      status: 'in_progress',
      pairings: round1Pairings
    });

    // Subsequent empty rounds
    let currentMatchCount = bracketSize / 4;
    for (let r = 2; r <= totalRounds; r++) {
      const pairings = [];
      for (let m = 0; m < currentMatchCount; m++) {
        pairings.push({
          id: `r${r}_m${m + 1}`,
          board: m + 1,
          whiteId: null,
          blackId: null,
          result: null
        });
      }
      rounds.push({
        roundNumber: r,
        name: this.getRoundName(r, totalRounds),
        status: 'pending',
        pairings: pairings
      });
      currentMatchCount /= 2;
    }

    return rounds;
  },

  getRoundName(r, totalRounds) {
    const diff = totalRounds - r;
    if (diff === 0) return 'Gran Final';
    if (diff === 1) return 'Semifinales';
    if (diff === 2) return 'Cuartos de Final';
    if (diff === 3) return 'Octavos de Final';
    return `Ronda ${r}`;
  },

  /**
   * Advances winners to the next bracket round
   */
  updateBracketProgression(rounds) {
    for (let r = 0; r < rounds.length - 1; r++) {
      const currentRound = rounds[r];
      const nextRound = rounds[r + 1];

      for (let i = 0; i < currentRound.pairings.length; i += 2) {
        const m1 = currentRound.pairings[i];
        const m2 = currentRound.pairings[i + 1];
        const nextMatchIndex = Math.floor(i / 2);
        const nextMatch = nextRound.pairings[nextMatchIndex];

        if (nextMatch) {
          // Winner of m1 becomes White of next match
          if (m1.result === '1-0') nextMatch.whiteId = m1.whiteId;
          else if (m1.result === '0-1') nextMatch.whiteId = m1.blackId;
          else nextMatch.whiteId = null;

          // Winner of m2 becomes Black of next match
          if (m2) {
            if (m2.result === '1-0') nextMatch.blackId = m2.whiteId;
            else if (m2.result === '0-1') nextMatch.blackId = m2.blackId;
            else nextMatch.blackId = null;
          }
        }
      }
    }
  }
};
