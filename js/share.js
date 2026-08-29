/**
 * Torneatron 2000 - Sharing & Report Generator
 * Formats tournament status, round pairings, and standings for WhatsApp, Telegram, and Print.
 */

import { Tiebreaks } from './tiebreaks.js';

export const Share = {
  /**
   * Generates formatted text for WhatsApp or clipboard
   */
  generateWhatsAppReport(tournament) {
    const standings = Tiebreaks.calculateAll(tournament);
    const currentRoundIdx = (tournament.currentRound || 1) - 1;
    const currentRound = tournament.rounds && tournament.rounds[currentRoundIdx];

    const playersMap = new Map(tournament.players.map(p => [p.id, p]));

    let text = `🏆 *${tournament.name.toUpperCase()}*\n`;
    text += `♟️ *Control de tiempo:* ${tournament.timeControl || 'Estándar'}\n`;
    text += `📅 *Ronda:* ${tournament.currentRound || 1} de ${tournament.roundsCount}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (currentRound) {
      text += `⚔️ *EMPAREJAMIENTOS - RONDA ${currentRound.roundNumber}*\n`;
      currentRound.pairings.forEach(match => {
        const white = playersMap.get(match.whiteId)?.name || 'Desconocido';
        const black = playersMap.get(match.blackId)?.name || 'Desconocido';
        const res = match.result ? `[ ${match.result} ]` : 'vs';
        text += `• *Mesa ${match.board}:* ⚪ ${white} ${res} ⚫ ${black}\n`;
      });

      if (currentRound.byePlayerId) {
        const byePlayer = playersMap.get(currentRound.byePlayerId)?.name || 'Desconocido';
        text += `• *Descanso (Bye 1.0 pt):* ${byePlayer}\n`;
      }
      text += `\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    text += `📊 *TABLA DE POSICIONES (TOP 10)*\n`;
    standings.slice(0, 10).forEach((p, idx) => {
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
      text += `${medal} *${p.name}* | *${p.score} pts* (Buch: ${p.buchholzCut1} | SB: ${p.sonnebornBerger})\n`;
    });

    text += `\nGenerado con *Torneatron 2000* ⚡`;

    return text;
  },

  /**
   * Opens WhatsApp with prefilled message
   */
  shareToWhatsApp(tournament) {
    const text = this.generateWhatsAppReport(tournament);
    const encoded = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  },

  /**
   * Copies report to clipboard
   */
  async copyToClipboard(tournament) {
    const text = this.generateWhatsAppReport(tournament);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  }
};
