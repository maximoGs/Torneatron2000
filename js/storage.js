/**
 * Torneatron 2000 - Storage & Preset Manager
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
      { id: 'p16', name: 'Hans Niemann', elo: 2715, club: 'EE.UU.', title: 'GM' }
    ];

    const selectedPlayers = masterPlayers.slice(0, size);

    return BracketEngine.createBracket({
      id: `torneo_demo_${size}`,
      name: `Copa Torneatron 2000 (${size} Maestros) ♟️`,
      sport: 'chess',
      timeControl: '10m + 5s',
      seedMode: 'elo',
      players: selectedPlayers
    });
  }
};
