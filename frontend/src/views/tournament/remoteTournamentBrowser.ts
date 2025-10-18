import { loadHtml } from "../../utils/htmlLoader.js";
import { remoteTournamentService } from "../../services/remoteTournament.service.js";
import { navigateTo } from "../../router/router.js";
import { toast } from "../../utils/toast.js";

export async function renderRemoteTournamentBrowser(container: HTMLElement | null) {
  if (!container) return;

  container.innerHTML = await loadHtml("/html/remoteTournamentBrowser.html");

  const browser = new TournamentBrowser(container);
  await browser.initialize();
}

class TournamentBrowser {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async initialize() {
    this.setupEventListeners();
    await this.loadTournaments();
  }

  private setupEventListeners() {
    // Create tournament button
    const createBtn = document.getElementById('create-tournament-btn');
    createBtn?.addEventListener('click', () => this.openCreateModal());

    // Modal close buttons
    const closeBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-create-btn');
    closeBtn?.addEventListener('click', () => this.closeCreateModal());
    cancelBtn?.addEventListener('click', () => this.closeCreateModal());

    // Create form submit
    const form = document.getElementById('create-tournament-form') as HTMLFormElement;
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.createTournament();
    });
  }

  private async loadTournaments() {
    const loadingEl = document.getElementById('tournaments-loading');
    const emptyEl = document.getElementById('tournaments-empty');
    const listEl = document.getElementById('tournaments-list');

    if (!loadingEl || !emptyEl || !listEl) return;

    try {
      // Show loading
      loadingEl.classList.remove('hidden');
      emptyEl.classList.add('hidden');
      listEl.classList.add('hidden');

      // Fetch tournaments
      const response = await remoteTournamentService.listTournaments();

      // Hide loading
      loadingEl.classList.add('hidden');

      if (!response.success || !response.tournaments || response.tournaments.length === 0) {
        // Show empty state
        emptyEl.classList.remove('hidden');
      } else {
        // Show tournaments
        listEl.classList.remove('hidden');
        listEl.innerHTML = '';

        response.tournaments.forEach(tournament => {
          const card = this.createTournamentCard(tournament);
          listEl.appendChild(card);
        });
      }
    } catch (error) {
      console.error('Failed to load tournaments:', error);
      loadingEl.classList.add('hidden');
      emptyEl.classList.remove('hidden');
      toast.error('Failed to load tournaments');
    }
  }

  private createTournamentCard(tournament: any): HTMLElement {
    const template = document.getElementById('tournament-card-template') as HTMLTemplateElement;
    const card = template.content.cloneNode(true) as DocumentFragment;
    const cardEl = card.querySelector('.tournament-card') as HTMLElement;

    // Tournament name
    const nameEl = card.querySelector('.tournament-name') as HTMLElement;
    nameEl.textContent = tournament.name;

    // Creator
    const creatorEl = card.querySelector('.tournament-creator') as HTMLElement;
    creatorEl.textContent = `by ${tournament.createdBy}`;

    // Phase badge
    const phaseEl = card.querySelector('.tournament-phase-badge') as HTMLElement;
    const phaseInfo = this.getPhaseInfo(tournament.phase);
    phaseEl.textContent = phaseInfo.text;
    phaseEl.className = `tournament-phase-badge rounded-full px-3 py-1 text-xs font-medium ${phaseInfo.class}`;

    // Players
    const playersEl = card.querySelector('.tournament-players') as HTMLElement;
    playersEl.textContent = `${tournament.players.length}/${tournament.config.maxPlayers}`;

    // Type
    const typeEl = card.querySelector('.tournament-type') as HTMLElement;
    typeEl.textContent = `${tournament.config.maxPlayers}-Player`;

    // Ranked
    const rankedEl = card.querySelector('.tournament-ranked') as HTMLElement;
    rankedEl.textContent = tournament.config.isRanked ? 'Yes' : 'No';

    // Join button
    const joinBtn = card.querySelector('.tournament-join-btn') as HTMLButtonElement;
    
    // Disable join if tournament is full or already started
    if (tournament.players.length >= tournament.config.maxPlayers || tournament.phase !== 'registration') {
      joinBtn.disabled = true;
      joinBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      joinBtn.classList.add('bg-gray-600', 'cursor-not-allowed');
      joinBtn.innerHTML = '<i class="fas fa-lock mr-2"></i>Unavailable';
    } else {
      joinBtn.addEventListener('click', () => this.joinTournament(tournament.id));
    }

    return cardEl;
  }

  private getPhaseInfo(phase: string): { text: string; class: string } {
    switch (phase) {
      case 'registration':
        return { text: 'Open', class: 'bg-green-600 text-white' };
      case 'ready':
        return { text: 'Ready', class: 'bg-blue-600 text-white' };
      case 'in_progress':
        return { text: 'In Progress', class: 'bg-yellow-600 text-white' };
      case 'completed':
        return { text: 'Completed', class: 'bg-purple-600 text-white' };
      default:
        return { text: phase, class: 'bg-gray-600 text-white' };
    }
  }

  private openCreateModal() {
    const modal = document.getElementById('create-tournament-modal');
    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
  }

  private closeCreateModal() {
    const modal = document.getElementById('create-tournament-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');

    // Reset form
    const form = document.getElementById('create-tournament-form') as HTMLFormElement;
    form?.reset();
  }

  private async createTournament() {
    const nameInput = document.getElementById('tournament-name') as HTMLInputElement;
    const maxPlayersInput = document.getElementById('tournament-max-players') as HTMLSelectElement;
    const rankedInput = document.getElementById('tournament-ranked') as HTMLInputElement;
    const spectatorsInput = document.getElementById('tournament-spectators') as HTMLInputElement;

    if (!nameInput || !maxPlayersInput) return;

    const name = nameInput.value.trim();
    if (!name) {
      toast.error('Please enter a tournament name');
      return;
    }

    try {
      const config = {
        maxPlayers: parseInt(maxPlayersInput.value),
        isRanked: rankedInput?.checked || false,
        allowSpectators: spectatorsInput?.checked || true,
      };

      // console.log('[Browser] Creating tournament:', name, config);

      // Create tournament
      const response = await remoteTournamentService.createTournament(name, config);

      // console.log('[Browser] Create tournament response:', response);

      if (!response.success || !response.tournament) {
        throw new Error(response.error || 'Failed to create tournament');
      }

      const tournamentId = response.tournament.id;
      // console.log('[Browser] Tournament created with ID:', tournamentId);

      toast.success('Tournament created successfully!');

      // Close modal
      this.closeCreateModal();

      // Small delay to ensure backend is ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to lobby
      // console.log('[Browser] Navigating to lobby with ID:', tournamentId);
      navigateTo(`/remote-tournament-lobby?id=${tournamentId}`, this.container);
    } catch (error) {
      console.error('Failed to create tournament:', error);
      toast.error('Failed to create tournament');
    }
  }

  private async joinTournament(tournamentId: string) {
    try {
      // Navigate to lobby - the lobby will handle joining
      navigateTo(`/remote-tournament-lobby?id=${tournamentId}`, this.container);
      toast.info('Joining tournament...');
    } catch (error) {
      console.error('Failed to join tournament:', error);
      toast.error('Failed to join tournament');
    }
  }
}
