/**
 * Torneatron 2000 - Main Application Controller
 */

import { Storage } from './storage.js';
import { Tiebreaks } from './tiebreaks.js';
import { SwissEngine } from './swissEngine.js';
import { RoundRobinEngine } from './roundRobinEngine.js';
import { EliminationEngine } from './eliminationEngine.js';
import { Share } from './share.js';
import { TournamentTimer } from './timer.js';

class App {
  constructor() {
    this.tournament = Storage.loadTournament();
    this.currentTab = 'rounds'; // 'rounds', 'standings', 'players', 'brackets', 'settings'
    this.selectedRoundNumber = this.tournament.currentRound || 1;

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
    this.renderAll();
    this.setupTheme();
  }

  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Modal Triggers
    this.setupModalTrigger('btn-new-tournament', 'modal-new-tournament');
    this.setupModalTrigger('btn-add-player', 'modal-add-player');
    this.setupModalTrigger('btn-share-modal', 'modal-share');

    // Close Modals
    document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close')) {
          document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
        }
      });
    });

    // Forms
    const formNewTournament = document.getElementById('form-new-tournament');
    if (formNewTournament) {
      formNewTournament.addEventListener('submit', (e) => this.handleCreateTournament(e));
    }

    const formAddPlayer = document.getElementById('form-add-player');
    if (formAddPlayer) {
      formAddPlayer.addEventListener('submit', (e) => this.handleAddPlayer(e));
    }

    // Export / Import
    const btnExport = document.getElementById('btn-export-json');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        Storage.exportJSON(this.tournament);
        this.showToast('Torneo exportado con éxito 📁', 'success');
      });
    }

    const importInput = document.getElementById('import-file-input');
    if (importInput) {
      importInput.addEventListener('change', (e) => this.handleImportFile(e));
    }

    // WhatsApp & Copy
    const btnShareWA = document.getElementById('btn-share-whatsapp');
    if (btnShareWA) {
      btnShareWA.addEventListener('click', () => Share.shareToWhatsApp(this.tournament));
    }

    const btnCopyReport = document.getElementById('btn-copy-report');
    if (btnCopyReport) {
      btnCopyReport.addEventListener('click', async () => {
        const ok = await Share.copyToClipboard(this.tournament);
        if (ok) this.showToast('¡Reporte copiado al portapapeles! 📋', 'success');
      });
    }

    const btnPrintSheet = document.getElementById('btn-print-sheet');
    if (btnPrintSheet) {
      btnPrintSheet.addEventListener('click', () => window.print());
    }

    // Next Round Generation
    const btnNextRound = document.getElementById('btn-generate-round');
    if (btnNextRound) {
      btnNextRound.addEventListener('click', () => this.generateNextRound());
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

    const btnTimerAdd5 = document.getElementById('btn-timer-add5');
    if (btnTimerAdd5) {
      btnTimerAdd5.addEventListener('click', () => {
        this.timer.addMinutes(5);
        this.showToast('+5 minutos agregados', 'success');
      });
    }
  }

  setupModalTrigger(btnId, modalId) {
    const btn = document.getElementById(btnId);
    const modal = document.getElementById(modalId);
    if (btn && modal) {
      btn.addEventListener('click', () => modal.classList.add('open'));
    }
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-tab') === tabName);
    });

    document.querySelectorAll('.view-section').forEach(section => {
      section.classList.toggle('active', section.id === `view-${tabName}`);
    });

    if (tabName === 'standings') this.renderStandings();
    if (tabName === 'rounds') this.renderRounds();
    if (tabName === 'players') this.renderPlayers();
    if (tabName === 'brackets') this.renderBrackets();
  }

  renderAll() {
    this.renderHeaderAndBanner();
    this.renderRounds();
    this.renderStandings();
    this.renderPlayers();
    this.renderBrackets();
  }

  renderHeaderAndBanner() {
    const t = this.tournament;
    const titleEl = document.getElementById('tournament-title');
    const badgeEl = document.getElementById('tournament-type-badge');
    const roundsMetaEl = document.getElementById('meta-rounds-info');
    const playersMetaEl = document.getElementById('meta-players-info');
    const timeControlEl = document.getElementById('meta-timecontrol-info');

    if (titleEl) titleEl.textContent = t.name;
    if (badgeEl) {
      const typeNames = {
        chess_swiss: '♟️ Suizo FIDE',
        chess_round_robin: '♟️ Round Robin',
        chess_elimination: '♟️ Eliminación Directa',
        general_swiss: '🏆 Suizo General',
        general_round_robin: '🏆 Liga / Todos contra Todos'
      };
      badgeEl.textContent = typeNames[t.type] || '🏆 Torneo';
    }

    if (roundsMetaEl) {
      roundsMetaEl.innerHTML = `Ronda <strong>${t.currentRound || 1}</strong> de <strong>${t.roundsCount}</strong>`;
    }
    if (playersMetaEl) {
      const activeCount = t.players.filter(p => p.active !== false).length;
      playersMetaEl.innerHTML = `<strong>${activeCount}</strong> Jugadores`;
    }
    if (timeControlEl) {
      timeControlEl.innerHTML = `Ritmo: <strong>${t.timeControl || 'Estándar'}</strong>`;
    }

    // Bracket nav visibility
    const bracketNav = document.getElementById('nav-brackets-btn');
    if (bracketNav) {
      bracketNav.style.display = t.type.includes('elimination') ? 'flex' : 'none';
    }
  }

  renderRounds() {
    const t = this.tournament;
    const container = document.getElementById('matches-container');
    const roundTitleEl = document.getElementById('current-round-display-title');
    const btnPrev = document.getElementById('btn-prev-round');
    const btnNext = document.getElementById('btn-next-round');

    if (!container) return;

    if (!t.rounds || t.rounds.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">♟️</div>
          <div class="empty-title">Aún no hay rondas generadas</div>
          <div class="empty-desc">Haz clic en el botón de abajo para generar los primeros emparejamientos oficiales.</div>
          <button id="btn-start-first-round" class="btn-action btn-primary" style="margin: 0 auto;">
            ⚡ Generar Ronda 1
          </button>
        </div>
      `;
      const startBtn = document.getElementById('btn-start-first-round');
      if (startBtn) startBtn.addEventListener('click', () => this.generateNextRound());
      return;
    }

    if (this.selectedRoundNumber > t.rounds.length) {
      this.selectedRoundNumber = t.rounds.length;
    }

    const currentRound = t.rounds[this.selectedRoundNumber - 1];
    if (roundTitleEl) {
      roundTitleEl.innerHTML = `⚔️ Ronda ${currentRound.roundNumber} ${currentRound.name ? `· ${currentRound.name}` : ''}`;
    }

    if (btnPrev) {
      btnPrev.disabled = this.selectedRoundNumber <= 1;
      btnPrev.onclick = () => {
        if (this.selectedRoundNumber > 1) {
          this.selectedRoundNumber--;
          this.renderRounds();
        }
      };
    }

    if (btnNext) {
      btnNext.disabled = this.selectedRoundNumber >= t.rounds.length;
      btnNext.onclick = () => {
        if (this.selectedRoundNumber < t.rounds.length) {
          this.selectedRoundNumber++;
          this.renderRounds();
        }
      };
    }

    const playersMap = new Map(t.players.map(p => [p.id, p]));
    let html = '';

    // Render Bye Card if any
    if (currentRound.byePlayerId) {
      const byePlayer = playersMap.get(currentRound.byePlayerId);
      html += `
        <div class="bye-card">
          <div class="bye-info">
            <span class="bye-tag">BYE +1.0</span>
            <strong>${byePlayer ? byePlayer.name : 'Jugador libre'}</strong>
          </div>
          <span style="font-size: 0.8rem; color: var(--text-secondary);">Descanso reglamentario</span>
        </div>
      `;
    }

    // Render matches
    currentRound.pairings.forEach(match => {
      const white = playersMap.get(match.whiteId);
      const black = playersMap.get(match.blackId);
      const isFinished = match.result !== null;

      html += `
        <div class="match-card ${isFinished ? 'is-finished' : 'is-pending'}" data-match-id="${match.id}">
          <div class="match-header">
            <span class="board-tag">Tablero / Mesa <strong>#${match.board}</strong></span>
            <span class="match-status-pill ${isFinished ? 'status-completed' : 'status-live'}">
              ${isFinished ? 'Finalizada' : 'En juego'}
            </span>
          </div>

          <div class="match-body">
            <!-- White Player -->
            <div class="player-slot white">
              <span class="player-color-badge">
                <span class="color-dot white"></span> Blancas
              </span>
              <span class="player-name-line">${white ? white.name : 'Por definir'}</span>
              <div class="player-meta-line">
                ${white && white.title ? `<span class="badge" style="background:var(--gold);color:#000;padding:1px 4px;border-radius:4px;font-size:0.65rem;font-weight:bold;">${white.title}</span>` : ''}
                <span class="player-elo">${white?.elo || 1200} Elo</span>
              </div>
            </div>

            <!-- VS & Score Result -->
            <div class="vs-divider">
              <span>VS</span>
              <span class="current-score-display">${match.result || '-'}</span>
            </div>

            <!-- Black Player -->
            <div class="player-slot black">
              <span class="player-color-badge">
                Negras <span class="color-dot black"></span>
              </span>
              <span class="player-name-line">${black ? black.name : 'Por definir'}</span>
              <div class="player-meta-line">
                <span class="player-elo">${black?.elo || 1200} Elo</span>
                ${black && black.title ? `<span class="badge" style="background:var(--gold);color:#000;padding:1px 4px;border-radius:4px;font-size:0.65rem;font-weight:bold;">${black.title}</span>` : ''}
              </div>
            </div>
          </div>

          <!-- Score Selector (Quick Mobile Tap) -->
          <div class="score-selector">
            <button class="score-btn ${match.result === '1-0' ? 'active-1-0' : ''}" data-result="1-0" data-match="${match.id}">
              1 - 0
              <span class="label">Ganan B</span>
            </button>
            <button class="score-btn ${match.result === '0.5-0.5' || match.result === '1/2-1/2' ? 'active-draw' : ''}" data-result="0.5-0.5" data-match="${match.id}">
              ½ - ½
              <span class="label">Tablas</span>
            </button>
            <button class="score-btn ${match.result === '0-1' ? 'active-0-1' : ''}" data-result="0-1" data-match="${match.id}">
              0 - 1
              <span class="label">Ganan N</span>
            </button>
            <button class="score-btn ${match.result === null ? 'active-reset' : ''}" data-result="null" data-match="${match.id}">
              🔄
              <span class="label">Limpiar</span>
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Attach click handlers to score buttons
    container.querySelectorAll('.score-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const matchId = e.currentTarget.getAttribute('data-match');
        const res = e.currentTarget.getAttribute('data-result');
        this.setMatchResult(matchId, res === 'null' ? null : res);
      });
    });
  }

  setMatchResult(matchId, result) {
    const currentRound = this.tournament.rounds[this.selectedRoundNumber - 1];
    if (!currentRound) return;

    const match = currentRound.pairings.find(m => m.id === matchId);
    if (match) {
      match.result = result;
      if (this.tournament.type.includes('elimination')) {
        EliminationEngine.updateBracketProgression(this.tournament.rounds);
      }
      Storage.saveTournament(this.tournament);
      this.renderRounds();
      this.renderStandings();
      if (this.tournament.type.includes('elimination')) {
        this.renderBrackets();
      }
    }
  }

  generateNextRound() {
    try {
      const t = this.tournament;
      const completedRounds = t.rounds ? t.rounds.length : 0;

      // Check if current round is complete
      if (completedRounds > 0) {
        const current = t.rounds[completedRounds - 1];
        const pending = current.pairings.filter(m => m.whiteId && m.blackId && m.result === null);
        if (pending.length > 0) {
          const confirmGen = confirm(`Aún quedan ${pending.length} partida(s) sin resultado en la ronda ${current.roundNumber}. ¿Deseas generar la siguiente ronda de todos modos?`);
          if (!confirmGen) return;
        }
      }

      if (t.type === 'chess_swiss' || t.type === 'general_swiss') {
        const nextRound = SwissEngine.generateNextRound(t);
        if (!t.rounds) t.rounds = [];
        t.rounds.push(nextRound);
        t.currentRound = nextRound.roundNumber;
        this.selectedRoundNumber = nextRound.roundNumber;
      } else if (t.type === 'chess_round_robin' || t.type === 'general_round_robin') {
        if (!t.rounds || t.rounds.length === 0) {
          t.rounds = RoundRobinEngine.generateAllRounds(t);
          t.currentRound = 1;
          this.selectedRoundNumber = 1;
        } else {
          if (t.currentRound < t.rounds.length) {
            t.currentRound++;
            this.selectedRoundNumber = t.currentRound;
            t.rounds[t.currentRound - 1].status = 'in_progress';
          } else {
            this.showToast('El torneo ya ha completado todas sus rondas 🏆', 'success');
            return;
          }
        }
      } else if (t.type.includes('elimination')) {
        if (!t.rounds || t.rounds.length === 0) {
          t.rounds = EliminationEngine.generateBrackets(t);
          t.currentRound = 1;
          this.selectedRoundNumber = 1;
        }
      }

      Storage.saveTournament(t);
      this.renderAll();
      this.showToast(`¡Ronda ${t.currentRound} generada con éxito! ⚡`, 'success');
      this.timer.reset();
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  }

  renderStandings() {
    const t = this.tournament;
    const standings = Tiebreaks.calculateAll(t);
    const tbody = document.getElementById('standings-table-body');
    if (!tbody) return;

    let html = '';
    standings.forEach((p, idx) => {
      const rank = idx + 1;
      const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
      const rankSymbol = rank === 1 ? '👑' : rank;

      html += `
        <tr>
          <td style="text-align:center;">
            <span class="rank-badge ${rankClass}">${rankSymbol}</span>
          </td>
          <td>
            <div class="player-cell-main">
              <div class="player-cell-name">
                ${p.title ? `<span style="color:var(--gold);font-weight:800;margin-right:4px;">${p.title}</span>` : ''}
                ${p.name}
              </div>
              <div class="player-cell-club">${p.club || 'Sin club'} · ${p.elo || 1200} Elo</div>
            </div>
          </td>
          <td style="text-align:center;">
            <span class="score-pts">${p.score}</span>
          </td>
          <td style="text-align:center;font-weight:700;">${p.buchholzCut1}</td>
          <td style="text-align:center;">${p.buchholzTotal}</td>
          <td style="text-align:center;">${p.sonnebornBerger}</td>
          <td style="text-align:center;">${p.wins}</td>
          <td style="text-align:center;">${p.aro || '-'}</td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  renderPlayers() {
    const t = this.tournament;
    const container = document.getElementById('players-roster-list');
    const totalCountEl = document.getElementById('roster-total-count');

    if (!container) return;
    if (totalCountEl) totalCountEl.textContent = `${t.players.length} Jugadores registrados`;

    let html = '';
    t.players.forEach(p => {
      const initials = p.name.split(' ').map(n => n[0]).slice(0, 2).join('');
      html += `
        <div class="player-roster-item" data-player-id="${p.id}">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="player-avatar">${initials}</div>
            <div>
              <div style="font-weight:700;">
                ${p.title ? `<span style="color:var(--gold);margin-right:4px;">[${p.title}]</span>` : ''}
                ${p.name}
              </div>
              <div style="font-size:0.78rem; color:var(--text-secondary);">
                ${p.club || 'Sin club'} · ${p.elo || 1200} Elo
              </div>
            </div>
          </div>
          <div class="player-roster-actions">
            <button class="icon-btn btn-toggle-player-active" data-id="${p.id}" title="${p.active !== false ? 'Pausar/Retirar' : 'Reactivar'}">
              ${p.active !== false ? '🟢' : '⏸️'}
            </button>
            <button class="icon-btn btn-delete-player" data-id="${p.id}" title="Eliminar">
              🗑️
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Handlers
    container.querySelectorAll('.btn-toggle-player-active').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pId = e.currentTarget.getAttribute('data-id');
        const pl = this.tournament.players.find(x => x.id === pId);
        if (pl) {
          pl.active = pl.active === false ? true : false;
          Storage.saveTournament(this.tournament);
          this.renderPlayers();
          this.renderHeaderAndBanner();
          this.showToast(`Estado de ${pl.name} actualizado`, 'success');
        }
      });
    });

    container.querySelectorAll('.btn-delete-player').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pId = e.currentTarget.getAttribute('data-id');
        if (confirm('¿Eliminar este jugador del torneo?')) {
          this.tournament.players = this.tournament.players.filter(x => x.id !== pId);
          Storage.saveTournament(this.tournament);
          this.renderAll();
          this.showToast('Jugador eliminado', 'warning');
        }
      });
    });
  }

  renderBrackets() {
    const t = this.tournament;
    const container = document.getElementById('brackets-view-container');
    if (!container) return;

    if (!t.rounds || !t.type.includes('elimination')) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏆</div>
          <div class="empty-title">Modo Eliminación Directa</div>
          <div class="empty-desc">Esta vista está activa para torneos con formato de Llaves / Playoffs.</div>
        </div>
      `;
      return;
    }

    const playersMap = new Map(t.players.map(p => [p.id, p]));
    let html = '<div class="brackets-container">';

    t.rounds.forEach(round => {
      html += `
        <div class="bracket-round-col">
          <div class="bracket-round-title">${round.name || `Ronda ${round.roundNumber}`}</div>
      `;

      round.pairings.forEach(match => {
        const white = playersMap.get(match.whiteId);
        const black = playersMap.get(match.blackId);
        const isWhiteWin = match.result === '1-0';
        const isBlackWin = match.result === '0-1';

        html += `
          <div class="bracket-match">
            <div class="bracket-player ${isWhiteWin ? 'winner' : ''}">
              <span>⚪ ${white ? white.name : 'Por definir'}</span>
              <span>${isWhiteWin ? '1' : match.result ? '0' : '-'}</span>
            </div>
            <div class="bracket-player ${isBlackWin ? 'winner' : ''}">
              <span>⚫ ${black ? black.name : 'Por definir'}</span>
              <span>${isBlackWin ? '1' : match.result ? '0' : '-'}</span>
            </div>
          </div>
        `;
      });

      html += `</div>`;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  handleCreateTournament(e) {
    e.preventDefault();
    const name = document.getElementById('input-tournament-name').value.trim();
    const type = document.getElementById('select-tournament-type').value;
    const roundsCount = parseInt(document.getElementById('input-rounds-count').value, 10) || 5;
    const timeControl = document.getElementById('input-time-control').value.trim() || '15m + 10s';
    const playersRaw = document.getElementById('textarea-initial-players').value.trim();

    if (!name) {
      this.showToast('Por favor escribe un nombre para el torneo', 'error');
      return;
    }

    // Parse players
    const lines = playersRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const players = lines.map((line, idx) => {
      const parts = line.split(',');
      const pName = parts[0]?.trim() || `Jugador ${idx + 1}`;
      const elo = parseInt(parts[1]?.trim(), 10) || 1200;
      const club = parts[2]?.trim() || '';
      const title = parts[3]?.trim() || '';

      return {
        id: `p_${Date.now()}_${idx}`,
        name: pName,
        elo: elo,
        club: club,
        title: title,
        score: 0,
        byesCount: 0,
        active: true,
        colorHistory: [],
        opponents: []
      };
    });

    if (players.length < 2) {
      this.showToast('Agrega al menos 2 jugadores para comenzar', 'error');
      return;
    }

    const newTournament = {
      id: `torneo_${Date.now()}`,
      name: name,
      type: type,
      sport: type.includes('chess') ? 'chess' : 'general',
      timeControl: timeControl,
      roundsCount: roundsCount,
      currentRound: 1,
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      tiebreakOrder: ['buchholz_cut1', 'buchholz_total', 'sonneborn_berger', 'wins'],
      players: players,
      rounds: []
    };

    // Auto generate Round 1
    if (type === 'chess_swiss' || type === 'general_swiss') {
      const r1 = SwissEngine.generateNextRound(newTournament);
      newTournament.rounds = [r1];
    } else if (type === 'chess_round_robin' || type === 'general_round_robin') {
      newTournament.rounds = RoundRobinEngine.generateAllRounds(newTournament);
    } else if (type.includes('elimination')) {
      newTournament.rounds = EliminationEngine.generateBrackets(newTournament);
    }

    this.tournament = newTournament;
    Storage.saveTournament(this.tournament);
    this.selectedRoundNumber = 1;
    this.renderAll();

    document.getElementById('modal-new-tournament').classList.remove('open');
    this.showToast('¡Torneo creado exitosamente! 🏆♟️', 'success');
  }

  handleAddPlayer(e) {
    e.preventDefault();
    const name = document.getElementById('input-player-name').value.trim();
    const elo = parseInt(document.getElementById('input-player-elo').value, 10) || 1200;
    const club = document.getElementById('input-player-club').value.trim();
    const title = document.getElementById('input-player-title').value.trim();

    if (!name) {
      this.showToast('Ingresa el nombre del jugador', 'error');
      return;
    }

    const newPlayer = {
      id: `p_${Date.now()}`,
      name: name,
      elo: elo,
      club: club,
      title: title,
      score: 0,
      byesCount: 0,
      active: true,
      colorHistory: [],
      opponents: []
    };

    this.tournament.players.push(newPlayer);
    Storage.saveTournament(this.tournament);
    this.renderAll();

    document.getElementById('form-add-player').reset();
    document.getElementById('modal-add-player').classList.remove('open');
    this.showToast(`Jugador ${name} añadido`, 'success');
  }

  handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = Storage.importJSON(event.target.result);
        this.tournament = imported;
        this.selectedRoundNumber = this.tournament.currentRound || 1;
        this.renderAll();
        this.showToast('Torneo importado correctamente 📥', 'success');
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    };
    reader.readAsText(file);
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
    }, 3200);
  }

  setupTheme() {
    const saved = localStorage.getItem('torneatron_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('torneatron_theme', next);
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
