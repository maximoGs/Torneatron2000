/**
 * Torneatron 2000 - Interactive Tournament Bracket Schema Engine
 * Supports 4, 8, 16, 32, 64 or any custom number of participants with automatic Byes and dynamic progression.
 */

export const BracketEngine = {
  /**
   * Initializes a full bracket tree structure
   */
  createBracket(tournamentData) {
    const rawPlayers = tournamentData.players || [];
    const seedMode = tournamentData.seedMode || 'elo'; // 'elo' | 'random' | 'manual'

    // Sort or shuffle players
    let players = [...rawPlayers];
    if (seedMode === 'elo') {
      players.sort((a, b) => (b.elo || 1200) - (a.elo || 1200));
    } else if (seedMode === 'random') {
      players.sort(() => Math.random() - 0.5);
    }

    const n = players.length;
    if (n < 2) {
      throw new Error('Se necesitan al menos 2 participantes para crear el esquema.');
    }

    // Determine bracket size (next power of 2: 4, 8, 16, 32, 64)
    let size = 2;
    while (size < n) {
      size *= 2;
    }

    const totalRounds = Math.log2(size);
    const rounds = [];

    // Seed into standard tournament bracket order (1 vs size, 2 vs size-1, etc. or traditional bracket seeding)
    const seededSlots = this.generateSeededOrder(size);
    const round1Matches = [];

    for (let i = 0; i < size / 2; i++) {
      const p1Index = seededSlots[i * 2] - 1;
      const p2Index = seededSlots[i * 2 + 1] - 1;

      const p1 = p1Index < n ? players[p1Index] : null;
      const p2 = p2Index < n ? players[p2Index] : null;

      // Determine initial White / Black
      const whitePlayer = p1;
      const blackPlayer = p2;

      // Auto-win if one is a Bye
      let result = null;
      let winnerId = null;
      if (whitePlayer && !blackPlayer) {
        result = '1-0';
        winnerId = whitePlayer.id;
      } else if (!whitePlayer && blackPlayer) {
        result = '0-1';
        winnerId = blackPlayer.id;
      }

      round1Matches.push({
        id: `r1_m${i + 1}`,
        round: 1,
        matchIndex: i,
        board: i + 1,
        player1: whitePlayer ? { ...whitePlayer, color: 'W' } : null,
        player2: blackPlayer ? { ...blackPlayer, color: 'B' } : null,
        result: result,
        winnerId: winnerId
      });
    }

    rounds.push({
      roundNumber: 1,
      name: this.getRoundName(1, totalRounds),
      matches: round1Matches
    });

    // Create remaining blank rounds
    let currentMatchCount = size / 4;
    for (let r = 2; r <= totalRounds; r++) {
      const roundMatches = [];
      for (let m = 0; m < currentMatchCount; m++) {
        roundMatches.push({
          id: `r${r}_m${m + 1}`,
          round: r,
          matchIndex: m,
          board: m + 1,
          player1: null,
          player2: null,
          result: null,
          winnerId: null
        });
      }
      rounds.push({
        roundNumber: r,
        name: this.getRoundName(r, totalRounds),
        matches: roundMatches
      });
      currentMatchCount /= 2;
    }

    const bracket = {
      id: tournamentData.id || `torneo_${Date.now()}`,
      name: tournamentData.name || 'Torneo de Enfrentamientos ♟️',
      sport: tournamentData.sport || 'chess',
      timeControl: tournamentData.timeControl || '15m + 10s',
      size: size,
      totalRounds: totalRounds,
      champion: null,
      rounds: rounds,
      players: players
    };

    // Propagate any auto-advances from Byes
    this.propagateWinners(bracket);

    return bracket;
  },

  /**
   * Sets winner for a specific match and recalculates the cascade forward
   */
  setMatchWinner(bracket, roundNumber, matchId, selectedWinnerId) {
    const round = bracket.rounds.find(r => r.roundNumber === roundNumber);
    if (!round) return;

    const match = round.matches.find(m => m.id === matchId);
    if (!match) return;

    // Toggle off if already winner
    if (match.winnerId === selectedWinnerId) {
      match.winnerId = null;
      match.result = null;
    } else {
      match.winnerId = selectedWinnerId;
      if (match.player1 && match.player1.id === selectedWinnerId) {
        match.result = '1-0';
      } else if (match.player2 && match.player2.id === selectedWinnerId) {
        match.result = '0-1';
      }
    }

    // Re-propagate from this round forward
    this.propagateWinners(bracket, roundNumber);

    // Check if tournament champion is crowned
    const finalRound = bracket.rounds[bracket.rounds.length - 1];
    const finalMatch = finalRound.matches[0];
    if (finalMatch && finalMatch.winnerId) {
      bracket.champion = finalMatch.winnerId === finalMatch.player1?.id ? finalMatch.player1 : finalMatch.player2;
    } else {
      bracket.champion = null;
    }

    return bracket;
  },

  /**
   * Propagates winners across all rounds in the tree
   */
  propagateWinners(bracket, startRound = 1) {
    for (let r = startRound; r < bracket.rounds.length; r++) {
      const currentRound = bracket.rounds[r - 1];
      const nextRound = bracket.rounds[r];

      for (let i = 0; i < currentRound.matches.length; i += 2) {
        const m1 = currentRound.matches[i];
        const m2 = currentRound.matches[i + 1];
        const nextMatchIndex = Math.floor(i / 2);
        const nextMatch = nextRound.matches[nextMatchIndex];

        if (nextMatch) {
          // Winner of m1 becomes Player 1 of next match (White)
          const p1Winner = m1 && m1.winnerId ? (m1.player1?.id === m1.winnerId ? m1.player1 : m1.player2) : null;
          nextMatch.player1 = p1Winner ? { ...p1Winner, color: 'W' } : null;

          // Winner of m2 becomes Player 2 of next match (Black)
          const p2Winner = m2 && m2.winnerId ? (m2.player1?.id === m2.winnerId ? m2.player1 : m2.player2) : null;
          nextMatch.player2 = p2Winner ? { ...p2Winner, color: 'B' } : null;

          // If previously chosen winner in next match is no longer in this match, reset it
          if (nextMatch.winnerId && nextMatch.winnerId !== nextMatch.player1?.id && nextMatch.winnerId !== nextMatch.player2?.id) {
            nextMatch.winnerId = null;
            nextMatch.result = null;
          }
        }
      }
    }
  },

  getRoundName(roundNum, totalRounds) {
    const diff = totalRounds - roundNum;
    if (diff === 0) return 'Gran Final 🏆';
    if (diff === 1) return 'Semifinales';
    if (diff === 2) return 'Cuartos de Final';
    if (diff === 3) return 'Octavos de Final';
    if (diff === 4) return 'Dieciseisavos';
    return `Ronda ${roundNum}`;
  },

  /**
   * Generates standard tournament seeding order to keep top seeds apart
   * (e.g. for 8: [1, 8, 4, 5, 2, 7, 3, 6])
   */
  generateSeededOrder(numParticipants) {
    let rounds = Math.log2(numParticipants) - 1;
    let pls = [1, 2];
    for (let i = 0; i < rounds; i++) {
      pls = this.nextSeedLayer(pls);
    }
    return pls;
  },

  nextSeedLayer(pls) {
    const out = [];
    const length = pls.length * 2 + 1;
    for (const d of pls) {
      out.push(d);
      out.push(length - d);
    }
    return out;
  }
};
