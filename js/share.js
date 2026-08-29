/**
 * Torneatron 2000 - Share & Report Formatter for Brackets
 */

export const Share = {
  generateBracketReport(bracket) {
    let text = `🏆 *${bracket.name.toUpperCase()}*\n`;
    text += `♟️ *Ritmo:* ${bracket.timeControl || 'Estándar'}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    bracket.rounds.forEach(round => {
      text += `⚔️ *${round.name.toUpperCase()}*\n`;
      round.matches.forEach(m => {
        const p1 = m.player1?.name || 'Por definir';
        const p2 = m.player2?.name || 'Por definir';
        const res = m.winnerId ? (m.winnerId === m.player1?.id ? `[ ${p1} GANADOR ✓ ]` : `[ ${p2} GANADOR ✓ ]`) : 'vs';

        text += `• Mesa ${m.board}: ⚪ ${p1} ${res} ⚫ ${p2}\n`;
      });
      text += `\n`;
    });

    if (bracket.champion) {
      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `👑 *¡CAMPEÓN DEL TORNEO!* 👑\n`;
      text += `🥇 *${bracket.champion.name}* (${bracket.champion.elo || 1200} Elo)\n\n`;
    }

    text += `Generado en vivo con *Torneatron 2000* ⚡`;
    return text;
  },

  shareToWhatsApp(bracket) {
    const text = this.generateBracketReport(bracket);
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  },

  async copyToClipboard(bracket) {
    const text = this.generateBracketReport(bracket);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  }
};
