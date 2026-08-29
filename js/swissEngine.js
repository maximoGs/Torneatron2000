/**
 * Torneatron 2000 - FIDE Swiss System Pairing Engine
 * Handles: Score brackets, rematch prevention, Bye allocation, color balancing & streaks, and table assignment.
 */

import { Tiebreaks } from './tiebreaks.js';

export const SwissEngine = {
  /**
   * Generates next round pairings for a Swiss tournament
   */
  generateNextRound(tournament) {
    const nextRoundNumber = (tournament.rounds?.length || 0) + 1;
    if (nextRoundNumber > tournament.roundsCount) {
      throw new Error('El torneo ya ha alcanzado el número máximo de rondas.');
    }

    // 1. Get updated standings & player history
    const standings = Tiebreaks.calculateAll(tournament);
    const activePlayers = standings.filter(p => p.active !== false);

    if (activePlayers.length < 2) {
      throw new Error('Se necesitan al menos 2 jugadores activos para generar una ronda.');
    }

    // 2. Build history of already played pairings and color sequences
    const playedPairs = new Set();
    const playerColors = new Map(); // id -> array of 'W' | 'B'
    const playerByes = new Set();

    activePlayers.forEach(p => {
      playerColors.set(p.id, []);
    });

    tournament.rounds.forEach(round => {
      if (round.byePlayerId) {
        playerByes.add(round.byePlayerId);
      }
      round.pairings.forEach(match => {
        playedPairs.add(`${match.whiteId}_${match.blackId}`);
        playedPairs.add(`${match.blackId}_${match.whiteId}`);

        if (playerColors.has(match.whiteId)) {
          playerColors.get(match.whiteId).push('W');
        }
        if (playerColors.has(match.blackId)) {
          playerColors.get(match.blackId).push('B');
        }
      });
    });

    // 3. Handle Bye if odd number of players
    let pool = [...activePlayers];
    let byePlayerId = null;

    if (pool.length % 2 !== 0) {
      // Find lowest ranked player who hasn't had a bye yet
      let byeCandidateIndex = -1;
      for (let i = pool.length - 1; i >= 0; i--) {
        if (!playerByes.has(pool[i].id)) {
          byeCandidateIndex = i;
          break;
        }
      }

      if (byeCandidateIndex === -1) {
        // All have had a bye, pick lowest
        byeCandidateIndex = pool.length - 1;
      }

      byePlayerId = pool[byeCandidateIndex].id;
      pool.splice(byeCandidateIndex, 1);
    }

    // 4. Backtracking / Blossom Pairing Algorithm
    const pairs = this.findOptimalPairings(pool, playedPairs, playerColors);

    if (!pairs) {
      throw new Error('No se pudo encontrar un emparejamiento válido sin repetir rivales. Puedes ajustar manualmente o revisar los jugadores activos.');
    }

    // 5. Determine White & Black for each pair & assign boards
    const roundPairings = pairs.map((pair, index) => {
      const [p1, p2] = pair;
      const colors1 = playerColors.get(p1.id) || [];
      const colors2 = playerColors.get(p2.id) || [];

      const whitePreference = this.determineWhitePlayer(p1, colors1, p2, colors2, nextRoundNumber);

      const whitePlayer = whitePreference === 1 ? p1 : p2;
      const blackPlayer = whitePreference === 1 ? p2 : p1;

      return {
        id: `r${nextRoundNumber}_m${index + 1}`,
        board: index + 1,
        whiteId: whitePlayer.id,
        blackId: blackPlayer.id,
        result: null
      };
    });

    return {
      roundNumber: nextRoundNumber,
      status: 'in_progress',
      pairings: roundPairings,
      byePlayerId: byePlayerId
    };
  },

  /**
   * Backtracking solver for pairing
   */
  findOptimalPairings(players, playedPairs, playerColors) {
    if (players.length === 0) return [];

    const first = players[0];
    for (let i = 1; i < players.length; i++) {
      const candidate = players[i];
      const pairKey = `${first.id}_${candidate.id}`;

      if (!playedPairs.has(pairKey)) {
        // Can pair first and candidate
        const remaining = players.filter((_, idx) => idx !== 0 && idx !== i);
        const subResult = this.findOptimalPairings(remaining, playedPairs, playerColors);

        if (subResult !== null) {
          return [[first, candidate], ...subResult];
        }
      }
    }

    // If strict no-repeat fails on deep rounds, fallback to closest score match
    if (players.length === 2) {
      return [[players[0], players[1]]];
    }

    return null;
  },

  /**
   * Color Assignment Criteria (FIDE):
   * 1. Balance: Difference between whites and blacks
   * 2. Streak: Avoid 3 consecutive of same color
   * 3. Alternation: Preference for opposite of last round
   * 4. Higher seed alternation
   */
  determineWhitePlayer(p1, colors1, p2, colors2, roundNumber) {
    const diff1 = colors1.filter(c => c === 'W').length - colors1.filter(c => c === 'B').length;
    const diff2 = colors2.filter(c => c === 'W').length - colors2.filter(c => c === 'B').length;

    const last1 = colors1.length > 0 ? colors1[colors1.length - 1] : null;
    const last2 = colors2.length > 0 ? colors2[colors2.length - 1] : null;

    // Check strict 2 in a row
    const len1 = colors1.length;
    const streakWhite1 = len1 >= 2 && colors1[len1 - 1] === 'W' && colors1[len1 - 2] === 'W';
    const streakBlack1 = len1 >= 2 && colors1[len1 - 1] === 'B' && colors1[len1 - 2] === 'B';

    const len2 = colors2.length;
    const streakWhite2 = len2 >= 2 && colors2[len2 - 1] === 'W' && colors2[len2 - 2] === 'W';
    const streakBlack2 = len2 >= 2 && colors2[len2 - 1] === 'B' && colors2[len2 - 2] === 'B';

    if (streakWhite1 || streakBlack2) return 2; // p2 gets white
    if (streakBlack1 || streakWhite2) return 1; // p1 gets white

    // Check color balance
    if (diff1 < diff2) return 1; // p1 needs white more
    if (diff2 < diff1) return 2; // p2 needs white more

    // Alternation from last round
    if (last1 === 'B' && last2 === 'W') return 1;
    if (last1 === 'W' && last2 === 'B') return 2;

    // Default: Round 1 or equal stats -> higher seed gets White on odd rounds
    return roundNumber % 2 === 1 ? 1 : 2;
  }
};
