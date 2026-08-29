/**
 * Torneatron 2000 - Storage & Extended Master Preset Database (Up to 64 Players)
 */

import { BracketEngine } from './bracketEngine.js';

const STORAGE_KEY = 'torneatron_bracket_data';

export const Storage = {
  saveBracket(bracket) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bracket));
      return true;
    } catch (e) {
      console.error('Error saving bracket:', e);
      return false;
    }
  },

  loadBracket() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return this.getDefaultSampleBracket(8);
      return JSON.parse(data);
    } catch (e) {
      console.error('Error loading bracket:', e);
      return this.getDefaultSampleBracket(8);
    }
  },

  exportJSON(bracket) {
    const jsonStr = JSON.stringify(bracket, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = `${bracket.name.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_esquema.json`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  getDefaultSampleBracket(size = 8) {
    const masterPlayers = [
      { id: 'p1', name: 'Magnus Carlsen', elo: 2835, club: 'Noruega', title: 'GM' },
      { id: 'p2', name: 'Hikaru Nakamura', elo: 2802, club: 'EE.UU.', title: 'GM' },
      { id: 'p3', name: 'Fabiano Caruana', elo: 2798, club: 'EE.UU.', title: 'GM' },
      { id: 'p4', name: 'Alireza Firouzja', elo: 2765, club: 'Francia', title: 'GM' },
      { id: 'p5', name: 'Gukesh D', elo: 2766, club: 'India', title: 'GM' },
      { id: 'p6', name: 'Nodirbek Abdusattorov', elo: 2760, club: 'Uzbekistán', title: 'GM' },
      { id: 'p7', name: 'Faustino Oro', elo: 2450, club: 'Argentina', title: 'IM' },
      { id: 'p8', name: 'Leinier Domínguez', elo: 2748, club: 'EE.UU.', title: 'GM' },
      { id: 'p9', name: 'Anish Giri', elo: 2745, club: 'Países Bajos', title: 'GM' },
      { id: 'p10', name: 'Wesley So', elo: 2757, club: 'EE.UU.', title: 'GM' },
      { id: 'p11', name: 'Richard Rapport', elo: 2720, club: 'Hungría', title: 'GM' },
      { id: 'p12', name: 'Jan-Krzysztof Duda', elo: 2730, club: 'Polonia', title: 'GM' },
      { id: 'p13', name: 'Levon Aronian', elo: 2725, club: 'EE.UU.', title: 'GM' },
      { id: 'p14', name: 'Maxime Vachier-Lagrave', elo: 2735, club: 'Francia', title: 'GM' },
      { id: 'p15', name: 'Daniil Dubov', elo: 2710, club: 'FIDE', title: 'GM' },
      { id: 'p16', name: 'Hans Niemann', elo: 2715, club: 'EE.UU.', title: 'GM' },
      { id: 'p17', name: 'Ding Liren', elo: 2750, club: 'China', title: 'GM' },
      { id: 'p18', name: 'Ian Nepomniachtchi', elo: 2767, club: 'FIDE', title: 'GM' },
      { id: 'p19', name: 'Praggnanandhaa R', elo: 2755, club: 'India', title: 'GM' },
      { id: 'p20', name: 'Vincent Keymer', elo: 2738, club: 'Alemania', title: 'GM' },
      { id: 'p21', name: 'Shakhriyar Mamedyarov', elo: 2734, club: 'Azerbaiyán', title: 'GM' },
      { id: 'p22', name: 'Alexander Grischuk', elo: 2728, club: 'FIDE', title: 'GM' },
      { id: 'p23', name: 'Parham Maghsoodloo', elo: 2722, club: 'Irán', title: 'GM' },
      { id: 'p24', name: 'Yu Yangyi', elo: 2718, club: 'China', title: 'GM' },
      { id: 'p25', name: 'Vidit Gujrathi', elo: 2721, club: 'India', title: 'GM' },
      { id: 'p26', name: 'Arjun Erigaisi', elo: 2795, club: 'India', title: 'GM' },
      { id: 'p27', name: 'Wei Yi', elo: 2762, club: 'China', title: 'GM' },
      { id: 'p28', name: 'Ray Robson', elo: 2705, club: 'EE.UU.', title: 'GM' },
      { id: 'p29', name: 'Sam Shankland', elo: 2690, club: 'EE.UU.', title: 'GM' },
      { id: 'p30', name: 'Alexei Shirov', elo: 2665, club: 'España', title: 'GM' },
      { id: 'p31', name: 'David Antón', elo: 2670, club: 'España', title: 'GM' },
      { id: 'p32', name: 'Jorden van Foreest', elo: 2685, club: 'Países Bajos', title: 'GM' }
    ];

    // Generate up to 64 if needed
    for (let i = 33; i <= 64; i++) {
      masterPlayers.push({
        id: `p${i}`,
        name: `Maestro #${i}`,
        elo: 2650 - (i - 33) * 8,
        club: 'Club Internacional',
        title: i <= 40 ? 'GM' : 'IM'
      });
    }

    const count = Math.min(size, 64);
    const selectedPlayers = masterPlayers.slice(0, count);

    return BracketEngine.createBracket({
      id: `torneo_demo_${count}`,
      name: `Copa Torneatron 2000 (${count} Maestros) ♟️`,
      sport: 'chess',
      timeControl: '10m + 5s',
      seedMode: 'elo',
      players: selectedPlayers
    });
  }
};
