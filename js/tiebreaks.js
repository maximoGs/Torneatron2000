/**
 * Torneatron 2000 - Chess & Tournament Tiebreak Calculations
 * Implements FIDE standards: Buchholz Cut 1, Buchholz Total, Sonneborn-Berger, Progresivo, Wins, ARO.
 */

export const Tiebreaks = {
  /**
   * Recalculates points and tiebreak metrics for all players in a tournament
   */
  calculateAll(tournament) {
    const playersMap = new Map();
    tournament.players.forEach(p => {
      playersMap.set(p.id, {
        ...p,
        score: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        opponentsIds: [],
        roundScores: [], // cumulative round scores for progressive tiebreak
        matchResults: [], // { oppId, result: 'win'|'draw'|'loss', isWhite: boolean }
      });
    });

    // 1. First pass: compute direct match scores & opponent histories across all completed rounds
    tournament.rounds.forEach(round => {
      // Check for bye
      if (round.byePlayerId && playersMap.has(round.byePlayerId)) {
        const p = playersMap.get(round.byePlayerId);
        p.score += 1.0;
        p.wins += 1;
        p.roundScores.push(p.score);
      }

      // Check match results
      round.pairings.forEach(match => {
        const white = playersMap.get(match.whiteId);
        const black = playersMap.get(match.blackId);

        if (!white || !black) return;

        white.opponentsIds.push(black.id);
        black.opponentsIds.push(white.id);

        if (match.result === '1-0') {
          white.score += 1.0;
          white.wins += 1;
          black.losses += 1;
          white.matchResults.push({ oppId: black.id, result: 'win', isWhite: true });
          black.matchResults.push({ oppId: white.id, result: 'loss', isWhite: false });
        } else if (match.result === '0.5-0.5' || match.result === '1/2-1/2') {
          white.score += 0.5;
          black.score += 0.5;
          white.draws += 1;
          black.draws += 1;
          white.matchResults.push({ oppId: black.id, result: 'draw', isWhite: true });
          black.matchResults.push({ oppId: white.id, result: 'draw', isWhite: false });
        } else if (match.result === '0-1') {
          black.score += 1.0;
          black.wins += 1;
          white.losses += 1;
          white.matchResults.push({ oppId: black.id, result: 'loss', isWhite: true });
          black.matchResults.push({ oppId: white.id, result: 'win', isWhite: false });
        }
      });
    });

    // 2. Second pass: Calculate Buchholz, Sonneborn-Berger, Progressive and ARO
    const standings = Array.from(playersMap.values()).map(player => {
      // Opponents scores array
      const oppScores = player.opponentsIds
        .map(oppId => playersMap.get(oppId)?.score || 0);

      // Buchholz Total
      const buchholzTotal = oppScores.reduce((sum, s) => sum + s, 0);

      // Buchholz Cut-1 (Remove lowest opponent score)
      let buchholzCut1 = 0;
      if (oppScores.length > 1) {
        const minScore = Math.min(...oppScores);
        buchholzCut1 = buchholzTotal - minScore;
      } else if (oppScores.length === 1) {
        buchholzCut1 = oppScores[0];
      }

      // Sonneborn-Berger (SB)
      let sonnebornBerger = 0;
      player.matchResults.forEach(m => {
        const oppScore = playersMap.get(m.oppId)?.score || 0;
        if (m.result === 'win') {
          sonnebornBerger += oppScore;
        } else if (m.result === 'draw') {
          sonnebornBerger += 0.5 * oppScore;
        }
      });

      // Progressive Score (Sum of cumulative round scores)
      let progressive = 0;
      let running = 0;
      player.matchResults.forEach(m => {
        if (m.result === 'win') running += 1;
        else if (m.result === 'draw') running += 0.5;
        progressive += running;
      });

      // Average Rating of Opponents (ARO)
      let aro = 0;
      if (player.opponentsIds.length > 0) {
        const totalOppElo = player.opponentsIds.reduce((sum, oppId) => {
          return sum + (playersMap.get(oppId)?.elo || 1200);
        }, 0);
        aro = Math.round(totalOppElo / player.opponentsIds.length);
      }

      return {
        ...player,
        buchholzCut1: Number(buchholzCut1.toFixed(2)),
        buchholzTotal: Number(buchholzTotal.toFixed(2)),
        sonnebornBerger: Number(sonnebornBerger.toFixed(2)),
        progressive: Number(progressive.toFixed(2)),
        aro: aro
      };
    });

    // 3. Sort Standings by Score and Configured Tiebreak Order
    standings.sort((a, b) => {
      // Primary: Tournament Score
      if (b.score !== a.score) return b.score - a.score;

      // Secondary: Tiebreak order from tournament settings
      const tiebreaks = tournament.tiebreakOrder || ['buchholz_cut1', 'buchholz_total', 'sonneborn_berger', 'wins'];
      for (const tb of tiebreaks) {
        if (tb === 'buchholz_cut1' && b.buchholzCut1 !== a.buchholzCut1) {
          return b.buchholzCut1 - a.buchholzCut1;
        }
        if (tb === 'buchholz_total' && b.buchholzTotal !== a.buchholzTotal) {
          return b.buchholzTotal - a.buchholzTotal;
        }
        if (tb === 'sonneborn_berger' && b.sonnebornBerger !== a.sonnebornBerger) {
          return b.sonnebornBerger - a.sonnebornBerger;
        }
        if (tb === 'wins' && b.wins !== a.wins) {
          return b.wins - a.wins;
        }
        if (tb === 'progresivo' && b.progressive !== a.progressive) {
          return b.progressive - a.progressive;
        }
      }

      // Tertiary: Initial Elo rating
      return (b.elo || 0) - (a.elo || 0);
    });

    return standings;
  }
};
