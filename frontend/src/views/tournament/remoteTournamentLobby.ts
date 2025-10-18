import { Subscription } from "rxjs";
import { loadHtml } from "../../utils/htmlLoader.js";
import { remoteTournamentService, TournamentPhase, TournamentPlayer, ChatMessage, TournamentState, MatchAssignmentPayload, MatchStatus } from "../../services/remoteTournament.service.js";
import { navigateTo } from "../../router/router.js";
import { toast } from "../../utils/toast.js";
import { getUserAvatar } from "../../services/profileService.js";
import { getCurrentUsername } from "../../utils/userUtils.js";

let activeLobby: TournamentLobby | null = null;

export async function renderRemoteTournamentLobby(container: HTMLElement | null) {
  if (!container) return;

  if (activeLobby) {
    console.log('[RemoteTournamentLobby] Cleaning up previous lobby instance');
    activeLobby.destroy();
    activeLobby = null;
  }

  remoteTournamentService.disconnect();
  remoteTournamentService.resetState();

  container.innerHTML = await loadHtml("/html/remoteTournamentLobby.html");
  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('id') || localStorage.getItem('currentTournamentId');
  
  console.log('[RemoteTournamentLobby] Tournament ID:', tournamentId);
  
  if (!tournamentId) {
    toast.error('No tournament selected');
    navigateTo('/dashboard', container);
    return;
  }
  // Clear any stale match assignment data once we're back in the lobby
  localStorage.removeItem('remoteTournamentMatch');
  localStorage.setItem('currentTournamentId', tournamentId);
  const lobby = new TournamentLobby(container, tournamentId);
  activeLobby = lobby;
  await lobby.initialize();
}

class TournamentLobby {
  private container: HTMLElement;
  private tournamentId: string;
  private subscriptions: Subscription[] = [];
  private playerRenderToken = 0;
  private bracketInitialized = false;

  constructor(container: HTMLElement, tournamentId: string) {
    this.container = container;
    this.tournamentId = tournamentId;
  }

  async initialize() {
    console.log('[Lobby] Initializing with tournament ID:', this.tournamentId);
    
    // First, verify the tournament exists via REST API
    let shouldReconnect = false;
    try {
      const response = await fetch(`/api/tournament/remote/${this.tournamentId}`);
      const result = await response.json();
      
      console.log('[Lobby] Tournament fetch result:', result);
      
      if (!result.success) {
        console.error('[Lobby] Tournament not found:', result.message);
        toast.error('Tournament not found');
        navigateTo('/remote-tournament', this.container);
        return;
      }

      const tournament: TournamentState = result.data;
      const username = getCurrentUsername() || 'Guest';
      const existingPlayer = tournament.players.find((player: TournamentPlayer) => player.username === username);

      if (!existingPlayer && tournament.phase !== TournamentPhase.REGISTRATION) {
        toast.error('Tournament already in progress');
        navigateTo('/remote-tournament', this.container);
        return;
      }

      shouldReconnect = Boolean(existingPlayer);
    } catch (error) {
      console.error('[Lobby] Error fetching tournament:', error);
      toast.error('Failed to load tournament');
      navigateTo('/remote-tournament', this.container);
      return;
    }
    
    // Now connect via WebSocket
    remoteTournamentService.connect(this.tournamentId, shouldReconnect);
    this.setupEventListeners();
    this.subscribeToStreams();
  }

  private setupEventListeners() {
    document.getElementById('leave-tournament-btn')?.addEventListener('click', () => this.leaveTournament());
    const readyBtn = document.getElementById('toggle-ready-btn') as HTMLButtonElement | null;
    readyBtn?.addEventListener('click', () => {
      console.log('[Lobby] Ready button clicked');
      readyBtn.setAttribute('disabled', 'true');
      remoteTournamentService.markReady();
    });
    document.getElementById('start-tournament-btn')?.addEventListener('click', () => {
      console.log('[Lobby] Start button clicked');
      remoteTournamentService.startTournament();
    });
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const sendChat = () => {
      const text = chatInput?.value.trim();
      if (text) { remoteTournamentService.sendChatMessage(text); chatInput.value = ''; }
    };
    document.getElementById('send-chat-btn')?.addEventListener('click', sendChat);
    chatInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChat(); });
  }

  private subscribeToStreams() {
    // Subscribe to tournament state updates
    const tournamentSub = remoteTournamentService.tournament$.subscribe(async (t: TournamentState | null) => {
      console.log('[Lobby] Tournament update:', t);
      if (!t) return;
      this.updateTournamentInfo(t);
      await this.updatePlayers(t);
      this.updatePhase(t.phase);
      this.updateBracket(t);
      if (t.phase === TournamentPhase.IN_PROGRESS) {
        console.log('[Lobby] Tournament started! Bracket:', t.bracket);
        toast.success('Tournament is starting!');
        // For now, just show the bracket info
        // TODO: Navigate to game/match when backend assigns matches
        // setTimeout(() => navigateTo(`/tournament-tree?mode=remote&id=${t.id}`, this.container), 2000);
      }
    });
    this.subscriptions.push(tournamentSub);

    // Subscribe to connection status
    const statusSub = remoteTournamentService.connectionStatus$.subscribe((s: string) => {
      console.log('[Lobby] Connection status:', s);
      this.updateConnectionStatus(s);
    });
    this.subscriptions.push(statusSub);

    // Subscribe to chat messages
    const chatSub = remoteTournamentService.chatMessages$.subscribe((m: ChatMessage) => {
      console.log('[Lobby] Chat message:', m);
      this.addChatMessage(m);
    });
    this.subscriptions.push(chatSub);

    // Subscribe to errors
    const errorSub = remoteTournamentService.errors$.subscribe((e: string) => {
      console.error('[Lobby] Error:', e);
      toast.error(e);
    });
    this.subscriptions.push(errorSub);

    const matchSub = remoteTournamentService.matchAssignments$.subscribe((assignment: MatchAssignmentPayload) => {
      if (!assignment) return;
      console.log('[Lobby] Match assignment received:', assignment);

      try {
        localStorage.setItem('remoteTournamentMatch', JSON.stringify({
          tournamentId: this.tournamentId,
          matchId: assignment.matchId,
          opponent: assignment.opponent || null,
        }));
      } catch (error) {
        console.warn('[Lobby] Failed to persist match info:', error);
      }

      this.destroy();
      const url = `/pong?mode=remote&gameId=${assignment.gameId}&side=${assignment.side}&tournamentId=${this.tournamentId}`;
      navigateTo(url, this.container);
    });
    this.subscriptions.push(matchSub);
  }

  private updateTournamentInfo(t: any) {
    const set = (id: string, content: string) => { const el = document.getElementById(id); if (el) el.innerHTML = content; };
    set('tournament-name', t.name);
    set('player-count', `(${t.players.length}/${t.config.maxPlayers})`);
    set('tournament-type', `<i class="fas ${t.config.isRanked ? 'fa-trophy' : 'fa-gamepad'} mr-2"></i>${t.config.maxPlayers}-Player Bracket`);
    set('tournament-ranked', `<i class="fas fa-star mr-2"></i>${t.config.isRanked ? 'Yes' : 'No'}`);
    set('tournament-spectators', `<i class="fas fa-eye mr-2"></i>${t.config.allowSpectators ? 'Allowed' : 'Not Allowed'}`);
  }

  private async updatePlayers(tournament: TournamentState) {
    const grid = document.getElementById('players-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const renderToken = ++this.playerRenderToken;
    const playerCards = await Promise.all(
      tournament.players.map((player: TournamentPlayer) => this.createPlayerCard(player))
    );

    if (renderToken !== this.playerRenderToken) {
      console.log('[Lobby] Skipping stale player render');
      return;
    }

    grid.innerHTML = '';

    playerCards.forEach((card: HTMLElement) => grid.appendChild(card));

    const maxPlayers = tournament.config?.maxPlayers ?? 4;
    const emptySlots = Math.max(0, maxPlayers - tournament.players.length);
    for (let i = 0; i < emptySlots; i++) {
      grid.appendChild(this.createEmptyCard());
    }

    this.updateReadyButton(tournament);
    this.updateStartButton(tournament);
  }

  private updateBracket(tournament: TournamentState) {
    const bracketSection = document.getElementById('bracket-section');
    if (!bracketSection) return;

    if (!tournament.bracket) {
      bracketSection.classList.add('hidden');
      return;
    }

    bracketSection.classList.remove('hidden');
    this.renderBracketMatch('semifinal-1', tournament.bracket.semifinals[0], 'SF1');
    this.renderBracketMatch('semifinal-2', tournament.bracket.semifinals[1], 'SF2');
    this.renderBracketMatch('final', tournament.bracket.finals, 'Final');
    if (tournament.bracket.thirdPlace) {
      this.renderBracketMatch('third-place', tournament.bracket.thirdPlace, '3rd Place');
    } else {
      const third = document.getElementById('third-place');
      if (third) third.innerHTML = this.renderEmptyMatch('Awaiting bracket generation');
    }

    const phaseLabel = document.getElementById('bracket-phase-label');
    if (phaseLabel) {
      phaseLabel.textContent = this.describeBracketStatus(tournament);
    }
  }

  private renderBracketMatch(elementId: string, match: any, stage: string) {
    const host = document.getElementById(elementId);
    if (!host) return;

    if (!match) {
      host.innerHTML = this.renderEmptyMatch('Awaiting players');
      return;
    }

    const template = document.getElementById('bracket-match-template') as HTMLTemplateElement;
    if (!template) return;

    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const stageLabel = fragment.querySelector('.match-stage') as HTMLElement;
    const statusLabel = fragment.querySelector('.match-status') as HTMLElement;
    const rows = fragment.querySelectorAll('.player-row');
    const meta = fragment.querySelector('.match-meta') as HTMLElement;

    stageLabel.textContent = stage;
  statusLabel.className = 'match-status text-xs font-bold text-(--color-primary)';
  statusLabel.textContent = this.formatMatchStatus(match.status);

    const players = [match.player1, match.player2];
    rows.forEach((row, index) => {
      const player = players[index];
      const seed = row.querySelector('.player-seed') as HTMLElement;
      const name = row.querySelector('.player-name') as HTMLElement;
      const score = row.querySelector('.player-score') as HTMLElement;

      if (player) {
        seed.textContent = `#${index + 1}`;
        name.textContent = player.displayName || player.username;
        const matchScore = match.score?.[index === 0 ? 'player1' : 'player2'];
        score.textContent = matchScore !== undefined ? String(matchScore) : '-';
        if (match.winner && player.id === match.winner.id) {
          row.classList.add('bg-emerald-500/10', 'border', 'border-emerald-400/40', 'rounded-lg', 'px-2', 'shadow', 'shadow-emerald-500/20');
          if (seed) {
            seed.innerHTML = '<i class="fas fa-crown text-yellow-400"></i>';
            seed.classList.remove('bg-(--color-primary)/10', 'text-(--color-primary)');
            seed.classList.add('bg-yellow-500/20', 'text-yellow-300', 'border', 'border-yellow-400/60');
          }
          name.classList.add('text-emerald-200');
          name.classList.add('drop-shadow');
          score.classList.add('text-emerald-300');

          if (match.status === MatchStatus.COMPLETED) {
            const winnerName = player.displayName || player.username;
            if (stage.toLowerCase().includes('final')) {
              statusLabel.innerHTML = `<i class="fas fa-trophy mr-1"></i> Champion: ${winnerName}`;
              statusLabel.classList.remove('text-(--color-primary)');
              statusLabel.classList.add('text-yellow-400');
            } else {
              statusLabel.textContent = `Winner: ${winnerName}`;
              statusLabel.classList.remove('text-(--color-primary)');
              statusLabel.classList.add('text-emerald-400');
            }
          } else if (match.status === MatchStatus.IN_PROGRESS) {
            statusLabel.textContent = 'In Progress';
            statusLabel.classList.remove('text-(--color-primary)');
            statusLabel.classList.add('text-orange-400');
          }
        }
      } else {
        seed.textContent = '—';
        name.textContent = 'TBD';
        score.textContent = '-';
      }
    });

    if (match.status === MatchStatus.IN_PROGRESS && !match.winner) {
      statusLabel.textContent = 'In Progress';
      statusLabel.classList.remove('text-(--color-primary)');
      statusLabel.classList.add('text-orange-400');
    }

    meta.textContent = this.describeMatchMeta(match);
    host.innerHTML = '';
    host.appendChild(fragment);
  }

  private renderEmptyMatch(message: string): string {
    return `
      <div class="rounded-xl border border-dashed border-(--color-primary-light)/30 bg-(--color-background)/60 p-4 text-center text-sm text-(--color-text-secondary)">
        ${message}
      </div>
    `;
  }

  private formatMatchStatus(status: string | undefined): string {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'pending':
      default:
        return 'Pending';
    }
  }

  private describeMatchMeta(match: any): string {
    if (match.completedAt) {
      return `Finished ${new Date(match.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (match.startedAt) {
      return `Started ${new Date(match.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return 'Awaiting start';
  }

  private describeBracketStatus(tournament: TournamentState): string {
    if (!tournament.bracket) {
      return 'Waiting for registration to complete';
    }
    if (tournament.phase === TournamentPhase.IN_PROGRESS) {
      if (tournament.bracket.finals.status === MatchStatus.IN_PROGRESS) {
        return 'Final match underway';
      }
      if (tournament.bracket.semifinals.some(match => match.status === MatchStatus.IN_PROGRESS)) {
        return 'Semifinals in progress';
      }
      if (tournament.bracket.semifinals.every(match => match.status === MatchStatus.COMPLETED) && tournament.bracket.finals.status === MatchStatus.PENDING) {
        return 'Finalists ready';
      }
      if (tournament.bracket.thirdPlace && tournament.bracket.thirdPlace.status === MatchStatus.IN_PROGRESS) {
        return 'Third place match underway';
      }
    }
    if (tournament.phase === TournamentPhase.COMPLETED) {
      return 'Tournament completed';
    }
    return 'Bracket initialized';
  }

  private async createPlayerCard(p: TournamentPlayer): Promise<HTMLElement> {
    const tmpl = document.getElementById('player-card-template') as HTMLTemplateElement;
    const frag = tmpl.content.cloneNode(true) as DocumentFragment;
    const card = frag.querySelector('.player-card') as HTMLElement;
    card.setAttribute('data-player-id', p.id);
    const avatar = frag.querySelector('.player-avatar') as HTMLImageElement;
    avatar.src = p.avatar || await getUserAvatar(p.username) || '/assets/avatars/default.png';
    (frag.querySelector('.player-name') as HTMLElement).textContent = p.displayName;
    (frag.querySelector('.player-status') as HTMLElement).classList.add(p.isConnected ? 'bg-green-500' : 'bg-gray-500');
    const ready = frag.querySelector('.player-ready-badge') as HTMLElement;
    const waiting = frag.querySelector('.player-waiting-badge') as HTMLElement;
    if (p.isReady) {
      ready.classList.remove('hidden'); waiting.classList.add('hidden');
      card.classList.add('border-green-500', 'bg-green-500/10');
    } else {
      ready.classList.add('hidden'); waiting.classList.remove('hidden');
      card.classList.add('border-gray-700', 'bg-gray-900/20');
    }
    return card;
  }

  private createEmptyCard(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'rounded-lg border-2 border-dashed border-gray-700 p-4 flex items-center justify-center h-24';
    card.innerHTML = '<div class="text-center text-gray-500"><i class="fas fa-user-plus text-2xl mb-2"></i><div class="text-sm">Waiting for player...</div></div>';
    return card;
  }

  private updatePhase(phase: TournamentPhase) {
    console.log('[Lobby] Phase update:', phase);
    const phaseEl = document.getElementById('tournament-phase');
    if (!phaseEl) return;
    const phases: Record<TournamentPhase, { text: string; class: string; icon: string }> = {
      [TournamentPhase.REGISTRATION]: { text: 'Registration', class: 'bg-blue-600', icon: 'fa-user-plus' },
      [TournamentPhase.READY]: { text: 'Ready to Start', class: 'bg-green-600', icon: 'fa-check-circle' },
      [TournamentPhase.IN_PROGRESS]: { text: 'In Progress', class: 'bg-yellow-600', icon: 'fa-play-circle' },
      [TournamentPhase.COMPLETED]: { text: 'Completed', class: 'bg-purple-600', icon: 'fa-trophy' },
      [TournamentPhase.ARCHIVED]: { text: 'Archived', class: 'bg-gray-600', icon: 'fa-archive' }
    };
    const p = phases[phase];
    if (!p) return;
    phaseEl.className = `inline-flex items-center rounded-full px-4 py-1 text-sm font-medium text-white ${p.class}`;
    phaseEl.innerHTML = `<i class="fas ${p.icon} mr-2"></i>${p.text}`;
  }

  private updateConnectionStatus(status: string) {
    const statusEl = document.getElementById('connection-status');
    if (!statusEl) return;
    const statuses: Record<string, { icon: string; color: string; text: string }> = {
      connected: { icon: 'fa-check-circle', color: 'text-green-500', text: 'Connected' },
      disconnected: { icon: 'fa-times-circle', color: 'text-red-500', text: 'Disconnected' },
      error: { icon: 'fa-exclamation-circle', color: 'text-red-500', text: 'Error' },
    };
    const s = statuses[status] || { icon: 'fa-circle', color: 'text-yellow-500', text: 'Connecting...' };
    statusEl.innerHTML = `<i class="fas ${s.icon} ${s.color} mr-1"></i> ${s.text}`;
  }

  private updateReadyButton(tournament: TournamentState) {
    const btn = document.getElementById('toggle-ready-btn');
    const txt = document.getElementById('ready-status-text');
    if (!btn || !txt) return;

    const user = getCurrentUsername() || 'Guest';
    console.log('[Lobby] Updating ready button. Username:', user, 'Players:', tournament.players);
    const cp = tournament.players.find((player: TournamentPlayer) => player.username === user);
    if (!cp) {
      console.log('[Lobby] Current player not found in players list');
      return;
    }
    console.log('[Lobby] Current player ready status:', cp.isReady);
    if (cp.isReady) {
      btn.innerHTML = '<i class="fas fa-check mr-2"></i> Ready';
      btn.classList.remove('bg-primary');
      btn.classList.add('bg-gray-600');
      btn.setAttribute('disabled', 'true');
      txt.textContent = 'You are ready! Waiting for others...';
    } else {
      btn.innerHTML = '<i class="fas fa-check mr-2"></i> Mark Ready';
      btn.classList.add('bg-primary');
      btn.classList.remove('bg-gray-600');
      btn.removeAttribute('disabled');
      txt.textContent = "Click ready when you're prepared to start";
    }
  }

  private updateStartButton(tournament: TournamentState) {
    const btn = document.getElementById('start-tournament-btn');
    if (!btn) return;

    const user = getCurrentUsername() || 'Guest';
    if (tournament.createdBy === user && tournament.phase === TournamentPhase.READY) {
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
  }

  private async addChatMessage(msg: ChatMessage) {
    const msgs = document.getElementById('chat-messages');
    if (!msgs) return;
    const tmpl = document.getElementById('chat-message-template') as HTMLTemplateElement;
    const frag = tmpl.content.cloneNode(true) as DocumentFragment;
    const avatar = frag.querySelector('.message-avatar') as HTMLImageElement;
    avatar.src = await getUserAvatar(msg.displayName) || '/assets/avatars/default.png';
    (frag.querySelector('.message-sender') as HTMLElement).textContent = msg.displayName;
    const date = new Date(msg.timestamp);
    (frag.querySelector('.message-time') as HTMLElement).textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    (frag.querySelector('.message-text') as HTMLElement).textContent = msg.message;
    msgs.appendChild(frag);
    msgs.scrollTop = msgs.scrollHeight;
  }

  private leaveTournament() {
    if (confirm('Are you sure you want to leave the tournament?')) {
      remoteTournamentService.leaveTournament();
      localStorage.removeItem('currentTournamentId');
      this.destroy();
      navigateTo('/dashboard', this.container);
    }
  }

  destroy() {
    console.log('[Lobby] Destroying, unsubscribing from', this.subscriptions.length, 'subscriptions');
    // Unsubscribe from all observables
    this.subscriptions.forEach(sub => {
      if (sub && sub.unsubscribe) {
        sub.unsubscribe();
      }
    });
    this.subscriptions = [];
    remoteTournamentService.disconnect();
    remoteTournamentService.resetState();
    if (activeLobby === this) {
      activeLobby = null;
    }
  }
}
