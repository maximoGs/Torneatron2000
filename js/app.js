/**
 * Torneatron 2000 - Interactive Schema Controller & Live Name Editing
 */

import { BracketEngine } from './bracketEngine.js';
import { Storage } from './storage.js';
import { Share } from './share.js';
import { TournamentTimer } from './timer.js';

class App {
  constructor() {
    this.bracket = Storage.loadBracket();
    this.timer = new TournamentTimer(
      (timeStr) => {
        const el = document.getElementById('timer-clock-display');
        if (el) el.textContent = timeStr;
      },
      () => {
        this.showToast('¡Tiempo de ronda finalizado! ⏰', 'warning');
      }
    );

    this.init();
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // Quick Size Switchers (2, 4, 8, 16, 32, 64)
    document.querySelectorAll('.btn-quick-size').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const size = parseInt(e.currentTarget.getAttribute('data-size'), 10);
        this.bracket = Storage.getDefaultSampleBracket(size);
        Storage.saveBracket(this.bracket);
        this.render();
        this.showToast(`Esquema creado con ${size} participantes ♟️`, 'success');
      });
    });

    // Custom Size Input & Button
    const btnCustomCount = document.getElementById('btn-apply-custom-size');
    const inputCustomCount = document.getElementById('input-custom-size-count');
    if (btnCustomCount && inputCustomCount) {
      btnCustomCount.addEventListener('click', () => {
        const val = parseInt(inputCustomCount.value, 10);
        if (isNaN(val) || val < 2 || val > 64) {
          this.showToast('Ingresa un número de participantes entre 2 y 64', 'error');
          return;
        }
        this.bracket = Storage.getDefaultSampleBracket(val);
        Storage.saveBracket(this.bracket);
        this.render();
        this.showToast(`Esquema generado con ${val} participantes ⚡`, 'success');
      });
    }

    // Sorteo / Shuffle
    const btnShuffle = document.getElementById('btn-shuffle-seeds');
    if (btnShuffle) {
      btnShuffle.addEventListener('click', () => {
        this.bracket = BracketEngine.createBracket({
          name: this.bracket.name,
          sport: this.bracket.sport,
          timeControl: this.bracket.timeControl,
          seedMode: 'random',
          players: this.bracket.players
        });
        Storage.saveBracket(this.bracket);
        this.render();
        this.showToast('¡Sorteo de emparejamientos realizado! 🎲', 'success');
      });
    }

    // Reset
    const btnReset = document.getElementById('btn-reset-matches');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('¿Deseas reiniciar todos los resultados del torneo?')) {
          this.bracket = BracketEngine.createBracket({
            name: this.bracket.name,
            sport: this.bracket.sport,
            timeControl: this.bracket.timeControl,
            seedMode: 'elo',
            players: this.bracket.players
          });
          Storage.saveBracket(this.bracket);
          this.render();
          this.showToast('Esquema reiniciado', 'warning');
        }
      });
    }

    // Modals
    const btnNew = document.getElementById('btn-new-tournament-modal');
    const modalNew = document.getElementById('modal-new-tournament');
    if (btnNew && modalNew) {
      btnNew.addEventListener('click', () => modalNew.classList.add('open'));
    }

    document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close')) {
          document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
        }
      });
    });

    const formNew = document.getElementById('form-new-tournament');
    if (formNew) {
      formNew.addEventListener('submit', (e) => this.handleCreateCustomTournament(e));
    }

    // WhatsApp & Copy
    const btnShareWA = document.getElementById('btn-share-whatsapp');
    if (btnShareWA) {
      btnShareWA.addEventListener('click', () => Share.shareToWhatsApp(this.bracket));
    }

    const btnCopy = document.getElementById('btn-copy-report');
    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const ok = await Share.copyToClipboard(this.bracket);
        if (ok) this.showToast('¡Esquema copiado al portapapeles! 📋', 'success');
      });
    }

    const btnPrint = document.getElementById('btn-print-sheet');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => window.print());
    }

    const btnExport = document.getElementById('btn-export-json');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        Storage.exportJSON(this.bracket);
        this.showToast('Torneo exportado en JSON 📁', 'success');
      });
    }

    // Timer Controls
    const btnTimerToggle = document.getElementById('btn-timer-toggle');
    if (btnTimerToggle) {
      btnTimerToggle.addEventListener('click', () => {
        if (this.timer.isRunning) {
          this.timer.pause();
          btnTimerToggle.textContent = '▶️ Iniciar';
          btnTimerToggle.classList.remove('btn-success');
          btnTimerToggle.classList.add('btn-primary');
        } else {
          this.timer.start();
          btnTimerToggle.textContent = '⏸️ Pausar';
          btnTimerToggle.classList.remove('btn-primary');
          btnTimerToggle.classList.add('btn-success');
        }
      });
    }

    const btnTimerReset = document.getElementById('btn-timer-reset');
    if (btnTimerReset) {
      btnTimerReset.addEventListener('click', () => {
        this.timer.reset();
        if (btnTimerToggle) {
          btnTimerToggle.textContent = '▶️ Iniciar';
          btnTimerToggle.classList.remove('btn-success');
          btnTimerToggle.classList.add('btn-primary');
        }
      });
    }
  }

  render() {
    const b = this.bracket;
    const titleEl = document.getElementById('bracket-tournament-title');
    const sizeBadgeEl = document.getElementById('bracket-size-badge');
    const container = document.getElementById('bracket-schema-container');
    const championBanner = document.getElementById('champion-banner-container');

    if (titleEl) titleEl.textContent = b.name;
    if (sizeBadgeEl) sizeBadgeEl.textContent = `⚡ ${b.participantsCount || b.size} Participantes · ${b.totalRounds} Rondas`;

    // Highlight active quick size button
    document.querySelectorAll('.btn-quick-size').forEach(btn => {
      const s = parseInt(btn.getAttribute('data-size'), 10);
      btn.classList.toggle('active', s === (b.participantsCount || b.size));
    });

    // Champion Banner
    if (championBanner) {
      if (b.champion) {
        championBanner.style.display = 'block';
        championBanner.innerHTML = `
          <div class="champion-card">
            <div class="champion-trophy">👑 🏆 👑</div>
            <div class="champion-subtitle">¡GRAN CAMPEÓN DEL TORNEO!</div>
            <div class="champion-name">${b.champion.name}</div>
            <div class="champion-meta">${b.champion.club || 'Campeón Invicto'} · ${b.champion.elo || 1200} Elo</div>
            <button class="btn-action btn-whatsapp" style="margin: 12px auto 0 auto;" onclick="window.app && window.app.shareWinner()">
              💬 Compartir Victoria en WhatsApp
            </button>
          </div>
        `;
      } else {
        championBanner.style.display = 'none';
        championBanner.innerHTML = '';
      }
    }

    // Render Bracket Schema Columns
    if (!container) return;
    let html = '<div class="bracket-tree-wrapper">';

    b.rounds.forEach((round) => {
      html += `
        <div class="bracket-column round-${round.roundNumber}">
          <div class="column-header">
            <span class="round-badge">${round.name}</span>
          </div>
          <div class="matches-column-body">
      `;

      round.matches.forEach((match) => {
        const p1 = match.player1;
        const p2 = match.player2;
        const p1IsWinner = match.winnerId && p1 && match.winnerId === p1.id;
        const p2IsWinner = match.winnerId && p2 && match.winnerId === p2.id;
        const isDecided = !!match.winnerId;

        html += `
          <div class="schema-match-card ${isDecided ? 'match-decided' : ''}">
            <div class="match-meta-bar">
              <span>Mesa <strong>#${match.board}</strong></span>
              <span class="match-help-text">${isDecided ? 'Ganador ✓' : 'Elige ganador 👇'}</span>
            </div>

            <!-- Player 1 Slot (White) -->
            <div class="schema-player-slot ${p1IsWinner ? 'is-winner' : ''} ${!p1 ? 'is-empty' : ''}">
              <div class="slot-left-content">
                <span class="color-indicator white" title="Piezas Blancas"></span>
                <div class="slot-player-details">
                  <div class="slot-name-row">
                    <span class="slot-name-text">${p1 ? p1.name : 'Por definir...'}</span>
                    ${p1 ? `<button class="btn-edit-name" data-player-id="${p1.id}" data-current-name="${p1.name}" title="Editar nombre">✏️</button>` : ''}
                  </div>
                  ${p1 ? `<span class="slot-elo-text">${p1.title ? p1.title + ' · ' : ''}${p1.elo || 1200} Elo</span>` : ''}
                </div>
              </div>
              <div class="slot-right-actions">
                ${p1 ? `
                  <button class="btn-choose-winner" 
                          data-round="${round.roundNumber}" 
                          data-match="${match.id}" 
                          data-player-id="${p1.id}">
                    ${p1IsWinner ? 'GANADOR ✓' : 'GANA'}
                  </button>
                ` : ''}
              </div>
            </div>

            <div class="schema-vs-divider">VS</div>

            <!-- Player 2 Slot (Black) -->
            <div class="schema-player-slot ${p2IsWinner ? 'is-winner' : ''} ${!p2 ? 'is-empty' : ''}">
              <div class="slot-left-content">
                <span class="color-indicator black" title="Piezas Negras"></span>
                <div class="slot-player-details">
                  <div class="slot-name-row">
                    <span class="slot-name-text">${p2 ? p2.name : 'Por definir...'}</span>
                    ${p2 ? `<button class="btn-edit-name" data-player-id="${p2.id}" data-current-name="${p2.name}" title="Editar nombre">✏️</button>` : ''}
                  </div>
                  ${p2 ? `<span class="slot-elo-text">${p2.title ? p2.title + ' · ' : ''}${p2.elo || 1200} Elo</span>` : ''}
                </div>
              </div>
              <div class="slot-right-actions">
                ${p2 ? `
                  <button class="btn-choose-winner" 
                          data-round="${round.roundNumber}" 
                          data-match="${match.id}" 
                          data-player-id="${p2.id}">
                    ${p2IsWinner ? 'GANADOR ✓' : 'GANA'}
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Attach Winner Click Handlers
    container.querySelectorAll('.btn-choose-winner').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const roundNum = parseInt(e.currentTarget.getAttribute('data-round'), 10);
        const matchId = e.currentTarget.getAttribute('data-match');
        const playerId = e.currentTarget.getAttribute('data-player-id');

        const hadChampionBefore = !!this.bracket.champion;
        this.bracket = BracketEngine.setMatchWinner(this.bracket, roundNum, matchId, playerId);
        Storage.saveBracket(this.bracket);
        this.render();

        if (!hadChampionBefore && this.bracket.champion) {
          this.triggerConfetti();
          this.showToast(`👑 ¡${this.bracket.champion.name} ES EL CAMPEÓN! 🏆`, 'success');
        }
      });
    });

    // Attach Edit Name Click Handlers
    container.querySelectorAll('.btn-edit-name').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pId = e.currentTarget.getAttribute('data-player-id');
        const currName = e.currentTarget.getAttribute('data-current-name');

        const newName = prompt('Editar nombre del participante:', currName);
        if (newName !== null && newName.trim() !== '') {
          this.bracket = BracketEngine.renamePlayer(this.bracket, pId, newName);
          Storage.saveBracket(this.bracket);
          this.render();
          this.showToast('Nombre actualizado', 'success');
        }
      });
    });
  }

  shareWinner() {
    Share.shareToWhatsApp(this.bracket);
  }

  handleCreateCustomTournament(e) {
    e.preventDefault();
    const name = document.getElementById('input-custom-name').value.trim() || 'Torneo Personalizado';
    const timeControl = document.getElementById('input-custom-timecontrol').value.trim() || '15m + 10s';
    const seedMode = document.getElementById('select-custom-seed').value || 'elo';
    const rawText = document.getElementById('textarea-custom-players').value.trim();

    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      this.showToast('Ingresa al menos 2 participantes', 'error');
      return;
    }

    const players = lines.map((line, idx) => {
      const parts = line.split(',');
      return {
        id: `p_${Date.now()}_${idx}`,
        name: parts[0]?.trim() || `Jugador ${idx + 1}`,
        elo: parseInt(parts[1]?.trim(), 10) || (1500 - idx * 20),
        club: parts[2]?.trim() || '',
        title: parts[3]?.trim() || ''
      };
    });

    try {
      this.bracket = BracketEngine.createBracket({
        name: name,
        sport: 'chess',
        timeControl: timeControl,
        seedMode: seedMode,
        players: players
      });
      Storage.saveBracket(this.bracket);
      this.render();
      document.getElementById('modal-new-tournament').classList.remove('open');
      this.showToast('¡Esquema generado con éxito! ⚡', 'success');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  triggerConfetti() {
    try {
      const count = 70;
      const colors = ['#f59e0b', '#10b981', '#38bdf8', '#ec4899', '#ffffff'];

      for (let i = 0; i < count; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti-piece';
        conf.style.left = Math.random() * 100 + 'vw';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.animationDelay = Math.random() * 0.8 + 's';
        conf.style.animationDuration = Math.random() * 2 + 1.5 + 's';
        document.body.appendChild(conf);

        setTimeout(() => conf.remove(), 3500);
      }
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
