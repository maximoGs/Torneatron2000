/**
 * Torneatron 2000 - Interactive Tournament Bracket Schema Engine
 * Supports 2 to 64 participants with automatic Byes, real-time winner cascades, and inline name edits.
 */

export const BracketEngine = {
  /**
   * Initializes a full bracket tree structure
   */
  createBracket(tournamentData) {
    const rawPlayers = tournamentData.players || [];
    const seedMode = tournamentData.seedMode || 'elo';

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

    // Bracket size (power of 2: 2, 4, 8, 16, 32, 64)
    let size = 2;
    while (size < n) {
      size *= 2;
    }

    const totalRounds = Math.log2(size);
    const rounds = [];

    const seededSlots = this.generateSeededOrder(size);
    const round1Matches = [];

    for (let i = 0; i < size / 2; i++) {
      const p1Index = seededSlots[i * 2] - 1;
      const p2Index = seededSlots[i * 2 + 1] - 1;

      const p1 = p1Index < n ? players[p1Index] : null;
      const p2 = p2Index < n ? players[p2Index] : null;

      let result = null;
      let winnerId = null;
      if (p1 && !p2) {
        result = '1-0';
        winnerId = p1.id;
      } else if (!p1 && p2) {
        result = '0-1';
        winnerId = p2.id;
      }

      round1Matches.push({
        id: `r1_m${i + 1}`,
        round: 1,
        matchIndex: i,
        board: i + 1,
        player1: p1 ? { ...p1, color: 'W' } : null,
        player2: p2 ? { ...p2, color: 'B' } : null,
        result: result,
        winnerId: winnerId
      });
    }

    rounds.push({
      roundNumber: 1,
      name: this.getRoundName(1, totalRounds),
      matches: round1Matches
    });

    // Create remaining rounds
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
      name: tournamentData.name || `Torneo de ${n} Jugadores ♟️`,
      sport: tournamentData.sport || 'chess',
      timeControl: tournamentData.timeControl || '15m + 10s',
      size: size,
      participantsCount: n,
      totalRounds: totalRounds,
      champion: null,
      rounds: rounds,
      players: players
    };

    this.propagateWinners(bracket);
    return bracket;
  },

  /**
   * Renames a player across the entire bracket in real time
   */
  renamePlayer(bracket, playerId, newName) {
    if (!newName || !newName.trim()) return bracket;
    const cleanName = newName.trim();

    // Update in players list
    const player = bracket.players.find(p => p.id === playerId);
    if (player) player.name = cleanName;

    // Update in all match slots across rounds
    bracket.rounds.forEach(round => {
      round.matches.forEach(m => {
        if (m.player1 && m.player1.id === playerId) {
          m.player1.name = cleanName;
        }
        if (m.player2 && m.player2.id === playerId) {
          m.player2.name = cleanName;
        }
      });
    });

    if (bracket.champion && bracket.champion.id === playerId) {
      bracket.champion.name = cleanName;
    }

    return bracket;
  },

  /**
   * Sets winner for a match
   */
  setMatchWinner(bracket, roundNumber, matchId, selectedWinnerId) {
    const round = bracket.rounds.find(r => r.roundNumber === roundNumber);
    if (!round) return bracket;

    const match = round.matches.find(m => m.id === matchId);
    if (!match) return bracket;

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

    this.propagateWinners(bracket, roundNumber);

    // Champion check
    const finalRound = bracket.rounds[bracket.rounds.length - 1];
    const finalMatch = finalRound.matches[0];
    if (finalMatch && finalMatch.winnerId) {
      bracket.champion = finalMatch.winnerId === finalMatch.player1?.id ? finalMatch.player1 : finalMatch.player2;
    } else {
      bracket.champion = null;
    }

    return bracket;
  },

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
          const p1Winner = m1 && m1.winnerId ? (m1.player1?.id === m1.winnerId ? m1.player1 : m1.player2) : null;
          nextMatch.player1 = p1Winner ? { ...p1Winner, color: 'W' } : null;

          const p2Winner = m2 && m2.winnerId ? (m2.player1?.id === m2.winnerId ? m2.player1 : m2.player2) : null;
          nextMatch.player2 = p2Winner ? { ...p2Winner, color: 'B' } : null;

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
    if (diff === 5) return 'Treintaidosavos';
    return `Ronda ${roundNum}`;
  },

  generateSeededOrder(numParticipants) {
    if (numParticipants <= 2) return [1, 2];
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
