/**
 * Torneatron 2000 - Storage & Tournament State Management
 */

const STORAGE_KEY = 'torneatron_current_tournament';
const STORAGE_LIST_KEY = 'torneatron_tournaments_list';

export const Storage = {
  // Save current tournament to LocalStorage
  saveTournament(tournament) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tournament));
      this.updateSavedList(tournament);
      return true;
    } catch (e) {
      console.error('Error saving tournament:', e);
      return false;
    }
  },

  // Load current active tournament
  loadTournament() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return this.getSampleChessTournament();
      return JSON.parse(data);
    } catch (e) {
      console.error('Error loading tournament:', e);
      return this.getSampleChessTournament();
    }
  },

  // Keep an index list of saved tournaments
  updateSavedList(tournament) {
    try {
      let list = JSON.parse(localStorage.getItem(STORAGE_LIST_KEY) || '[]');
      const index = list.findIndex(t => t.id === tournament.id);
      const summary = {
        id: tournament.id,
        name: tournament.name,
        type: tournament.type,
        roundsCount: tournament.roundsCount,
        currentRound: tournament.currentRound,
        playersCount: tournament.players.length,
        updatedAt: new Date().toISOString()
      };

      if (index >= 0) {
        list[index] = summary;
      } else {
        list.unshift(summary);
      }
      localStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error updating tournament list:', e);
    }
  },

  // Export tournament to a JSON downloadable file
  exportJSON(tournament) {
    const jsonStr = JSON.stringify(tournament, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = `${tournament.name.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_torneatron.json`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Import tournament from JSON string or file
  importJSON(jsonString) {
    try {
      const tournament = JSON.parse(jsonString);
      if (!tournament.name || !Array.isArray(tournament.players)) {
        throw new Error('Formato de torneo inválido');
      }
      this.saveTournament(tournament);
      return tournament;
    } catch (e) {
      throw new Error('Error al parsear el archivo JSON: ' + e.message);
    }
  },

  // High Quality Default Sample Chess Tournament
  getSampleChessTournament() {
    return {
      id: 'torneo_suizo_demo_2026',
      name: 'Grand Prix Ajedrez Torneatron ♟️',
      type: 'chess_swiss', // 'chess_swiss', 'chess_round_robin', 'chess_elimination', 'general_swiss', 'general_round_robin'
      sport: 'chess',
      timeControl: '15m + 10s',
      roundsCount: 5,
      currentRound: 1,
      status: 'in_progress', // 'setup', 'in_progress', 'completed'
      createdAt: new Date().toISOString(),
      tiebreakOrder: ['buchholz_cut1', 'buchholz_total', 'sonneborn_berger', 'wins', 'progresivo'],
      players: [
        { id: 'p1', name: 'Magnus Carlsen', elo: 2835, club: 'Noruega', title: 'GM', score: 0, byesCount: 0, active: true, colorHistory: [], opponents: [] },
        { id: 'p2', name: 'Hikaru Nakamura', elo: 2802, club: 'EE.UU.', title: 'GM', score: 0, byesCount: 0, active: true, colorHistory: [], opponents: [] },
        { id: 'p3', name: 'Fabiano Caruana', elo: 2798, club: 'EE.UU.', title: 'GM', score: 0, byesCount: 0, active: true, colorHistory: [], opponents: [] },
        { id: 'p4', name: 'Alireza Firouzja', elo: 2765, club: 'Francia', title: 'GM', score: 0, byesCount: 0, active: true, colorHistory: [], opponents: [] },
        { id: 'p5', name: 'Gukesh D', elo: 2766, club: 'India', title: 'GM', score: 0, byesCount: 0, active: true, colorHistory: [], opponents: [] },
        { id: 'p6', name: 'Nodirbek Abdusattorov', elo: 2760, club: 'Uzbekistán', title: 'GM', score: 0, byesCount: 0, active: true, colorHistory: [], opponents: [] },
        { id: 'p7', name: 'Faustino Oro', elo: 2450, club: 'Argentina', title: 'IM', score: 0, byesCount: 0, active: true, colorHistory: [], opponents: [] },
        { id: 'p8', name: 'Leinier Domínguez', elo: 2748, club: 'EE.UU.', title: 'GM', score: 0, byesCount: 0, active: true, colorHistory: [], opponents: [] }
      ],
      rounds: [
        {
          roundNumber: 1,
          status: 'in_progress',
          pairings: [
            {
              id: 'r1_m1',
              board: 1,
              whiteId: 'p1',
              blackId: 'p5',
              result: null // '1-0', '0.5-0.5', '0-1', null
            },
            {
              id: 'r1_m2',
              board: 2,
              whiteId: 'p6',
              blackId: 'p2',
              result: null
            },
            {
              id: 'r1_m3',
              board: 3,
              whiteId: 'p3',
              blackId: 'p7',
              result: null
            },
            {
              id: 'r1_m4',
              board: 4,
              whiteId: 'p8',
              blackId: 'p4',
              result: null
            }
          ],
          byePlayerId: null
        }
      ]
    };
  }
};
