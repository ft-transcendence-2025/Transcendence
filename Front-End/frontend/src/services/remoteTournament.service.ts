import { BehaviorSubject, Subject, Observable, timer, Subscription } from 'rxjs';
import { filter, map, takeUntil, retry, delay } from 'rxjs/operators';
import { getCurrentUsername as getUsernameFromAuth } from '../utils/userUtils.js';

/**
 * Tournament Phase Enum
 */
export enum TournamentPhase {
  REGISTRATION = 'registration',
  READY = 'ready',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum MatchStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

/**
 * Type Definitions
 */
export interface TournamentPlayer {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  joinedAt: number;
  isReady: boolean;
  isConnected: boolean;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  position: number;
  player1?: TournamentPlayer;
  player2?: TournamentPlayer;
  winner?: TournamentPlayer;
  status: MatchStatus;
  gameId?: number;
  startedAt?: number;
  completedAt?: number;
  score?: {
    player1: number;
    player2: number;
  };
}

export interface TournamentBracket {
  semifinals: Match[];
  finals: Match;
  thirdPlace?: Match;
}

export interface TournamentConfig {
  maxPlayers: number;
  minPlayers: number;
  registrationTimeout: number;
  matchTimeout: number;
  isRanked: boolean;
  allowSpectators: boolean;
}

export interface TournamentState {
  id: string;
  name: string;
  phase: TournamentPhase;
  config: TournamentConfig;
  players: TournamentPlayer[];
  bracket: TournamentBracket | null;
  currentRound: number;
  spectatorCount: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  createdBy: string;
}

export interface ChatMessage {
  playerId: string;
  displayName: string;
  message: string;
  timestamp: number;
}

export interface TournamentMessage {
  type: string;
  data?: any;
  message?: string;
}

export interface MatchAssignmentPayload {
  tournamentId: string;
  matchId: string;
  round: number;
  gameId: number;
  gameMode: string;
  side: 'left' | 'right';
  opponent?: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  } | null;
}

/**
 * Modern Reactive Tournament Service
 * Built with RxJS for reactive state management
 */
export class RemoteTournamentService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatSubscription: Subscription | null = null;
  private currentUsername: string | null = null;
  private currentPlayerState: TournamentPlayer | null = null;
  private intentionalDisconnect = false; // Flag to prevent reconnection after intentional leave
  private pendingMatchRequestId: string | null = null;
  private lastAssignedMatchId: string | null = null;
  
  // RxJS Subjects for reactive state
  private _tournamentState$ = new BehaviorSubject<TournamentState | null>(null);
  private _connectionStatus$ = new BehaviorSubject<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  private _chatMessages$ = new Subject<ChatMessage>();
  private _errors$ = new Subject<string>();
  private _matchAssignments$ = new Subject<MatchAssignmentPayload>();
  private destroy$ = new Subject<void>();

  // Public observables
  public tournament$: Observable<TournamentState | null> = this._tournamentState$.asObservable();
  public connectionStatus$: Observable<string> = this._connectionStatus$.asObservable();
  public chatMessages$: Observable<ChatMessage> = this._chatMessages$.asObservable();
  public errors$: Observable<string> = this._errors$.asObservable();
  public matchAssignments$: Observable<MatchAssignmentPayload> = this._matchAssignments$.asObservable();
  
  // Derived observables
  public players$: Observable<TournamentPlayer[]>;
  public currentPlayer$: Observable<TournamentPlayer | null>;
  public isReady$: Observable<boolean>;
  public canStart$: Observable<boolean>;
  public phase$: Observable<TournamentPhase | null>;
  public bracket$: Observable<TournamentBracket | null>;
  public nextMatch$: Observable<Match | null>;

  constructor() {
    // Setup derived observables
    this.players$ = this.tournament$.pipe(
      map((t: TournamentState | null) => t?.players || [])
    );

    this.currentPlayer$ = this.tournament$.pipe(
      map((t: TournamentState | null) => {
        if (!t) return null;
        const username = this.getCurrentUsername();
        const player = t.players.find((p: TournamentPlayer) => p.username === username) || null;
        this.currentPlayerState = player; // Cache current player
        return player;
      })
    );

    this.isReady$ = this.currentPlayer$.pipe(
      map((p: TournamentPlayer | null) => p?.isReady || false)
    );

    this.canStart$ = this.tournament$.pipe(
      map((t: TournamentState | null) => {
        if (!t || t.phase !== TournamentPhase.READY) return false;
        const username = this.getCurrentUsername();
        return t.createdBy === username;
      })
    );

    this.phase$ = this.tournament$.pipe(
      map((t: TournamentState | null) => t?.phase || null)
    );

    this.bracket$ = this.tournament$.pipe(
      map((t: TournamentState | null) => t?.bracket || null)
    );

    this.nextMatch$ = this.tournament$.pipe(
      map((t: TournamentState | null) => {
        if (!t || !t.bracket) return null;
        return this.findNextMatch(t);
      })
    );
  }

  /**
   * Create a new tournament
   */
  public async createTournament(
    name: string,
    config?: Partial<TournamentConfig>
  ): Promise<{ success: boolean; tournament?: TournamentState; error?: string }> {
    try {
      const username = this.getCurrentUsername();
      
      const response = await fetch('/api/tournament/remote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          createdBy: username,
          config,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return { success: true, tournament: result.data };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error) {
      // console.error('[TournamentService] Error creating tournament:', error);
      return { success: false, error: 'Failed to create tournament' };
    }
  }

  /**
   * List active tournaments
   */
  public async listTournaments(): Promise<{ success: boolean; tournaments?: TournamentState[]; error?: string }> {
    try {
      const response = await fetch('/api/tournament/remote');
      const result = await response.json();

      if (result.success) {
        return { success: true, tournaments: result.data };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error) {
      // console.error('[TournamentService] Error listing tournaments:', error);
      return { success: false, error: 'Failed to list tournaments' };
    }
  }

  /**
   * Get tournament details
   */
  public async getTournament(tournamentId: string): Promise<{ success: boolean; tournament?: TournamentState; error?: string }> {
    try {
      const response = await fetch(`/api/tournament/remote/${tournamentId}`);
      const result = await response.json();

      if (result.success) {
        return { success: true, tournament: result.data };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error) {
      // console.error('[TournamentService] Error getting tournament:', error);
      return { success: false, error: 'Failed to get tournament' };
    }
  }

  /**
   * Connect to tournament via WebSocket
   */
  public connect(tournamentId: string, reconnect: boolean = false): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      // console.warn('[TournamentService] Already connected');
      return;
    }

    const username = this.getCurrentUsername();
    const action = reconnect ? 'reconnect' : '';
    // console.log('[TournamentService] Attempting connection', { username, tournamentId, reconnect });
    const url = `wss://${window.location.host}/ws/game/remotetournament/${tournamentId}/${username}${action ? '/' + action : ''}`;

    // console.log(`[TournamentService] Connecting to ${url}`);

    this.intentionalDisconnect = false;
    this.reconnectAttempts = 0;

    this._connectionStatus$.next('connecting');
    this.ws = new WebSocket(url);

    this.setupWebSocketHandlers();
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    // Open event
    this.ws.addEventListener('open', () => {
      // console.log('[TournamentService] Connected');
      this._connectionStatus$.next('connected');
      this.reconnectAttempts = 0;

      // Start heartbeat
      this.startHeartbeat();
    });

    // Message event
    this.ws.addEventListener('message', (event) => {
      try {
        const message: TournamentMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        // console.error('[TournamentService] Error parsing message:', error);
      }
    });

    // Close event
    this.ws.addEventListener('close', (event) => {
      // console.log('[TournamentService] Disconnected');
      this._connectionStatus$.next('disconnected');

      // Don't reconnect if this was an intentional disconnect
      if (this.intentionalDisconnect) {
        // console.log('[TournamentService] Intentional disconnect - not reconnecting');
        this.intentionalDisconnect = false; // Reset flag
        return;
      }

      // Attempt reconnection for unintentional disconnects
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        // console.log(`[TournamentService] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
          const tournamentId = this._tournamentState$.value?.id;
          if (tournamentId) {
            this.connect(tournamentId, true);
          }
        }, 3000); // 3 second delay between reconnect attempts
      } else {
        this._errors$.next('Connection lost. Please refresh the page.');
      }
    });

    // Error event
    this.ws.addEventListener('error', (error) => {
      // console.error('[TournamentService] WebSocket error:', error);
      this._connectionStatus$.next('error');
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: TournamentMessage): void {
    // console.log('[TournamentService] Received message:', message.type, message);

    switch (message.type) {
      case 'connected':
        // console.log('[TournamentService] Connection confirmed');
        break;

      case 'tournament:state':
        // console.log('[TournamentService] Tournament state update:', message.data);
        this._tournamentState$.next(message.data);
        this.evaluateMatchRequest(message.data as TournamentState);
        break;

      case 'tournament:started':
        // console.log('[TournamentService] Tournament started:', message.data);
        this._tournamentState$.next(message.data);
        this.evaluateMatchRequest(message.data as TournamentState);
        break;

      case 'player:status':
        // console.log('[TournamentService] Player status update:', message.data);
        // Update player status in current state
        const currentState = this._tournamentState$.value;
        if (currentState) {
          const players = currentState.players.map((player: TournamentPlayer) =>
            player.id === message.data.playerId
              ? { ...player, isReady: message.data.status === 'ready' }
              : player
          );
          this._tournamentState$.next({ ...currentState, players });
        }
        break;

      case 'match:assigned':
        // console.log('[TournamentService] Match assigned:', message.data);
        this.lastAssignedMatchId = message.data?.matchId || null;
        this.pendingMatchRequestId = null;
        this._matchAssignments$.next(message.data as MatchAssignmentPayload);
        break;

      case 'match:pending':
        // console.log('[TournamentService] Match pending opponent:', message.data);
        break;

      case 'match:none':
        // console.log('[TournamentService] No match available:', message.message);
        this.pendingMatchRequestId = null;
        break;

      case 'chat:message':
        // console.log('[TournamentService] Chat message:', message.data);
        this._chatMessages$.next(message.data);
        break;

      case 'error':
        // console.error('[TournamentService] Error message:', message.message);
        this._errors$.next(message.message || 'Unknown error');
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        // console.warn('[TournamentService] Unknown message type:', message.type, message);
    }
  }

  /**
   * Send WebSocket message
   */
  private send(message: TournamentMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // console.warn('[TournamentService] Cannot send - not connected');
    }
  }

  /**
   * Toggle player ready status
   */
  public markReady(): void {
    const currentState = this._tournamentState$.value;
    if (!currentState) {
      // console.warn('[TournamentService] Cannot toggle ready - no tournament state');
      return;
    }

    const username = this.getCurrentUsername();
    const currentPlayer = currentState.players.find((player: TournamentPlayer) => player.username === username);
    if (!currentPlayer) {
      // console.warn('[TournamentService] Cannot mark ready - player not found in tournament');
      return;
    }

    if (currentPlayer.isReady) {
      // console.log('[TournamentService] Player already ready; skipping mark');
      return;
    }

    this.currentPlayerState = currentPlayer;

    this.send({ type: 'player:ready' });
  }

  /**
   * Start tournament (creator only)
   */
  public startTournament(): void {
    // console.log('[TournamentService] Starting tournament...');
    this.send({ type: 'tournament:start' });
  }

  /**
   * Request next match assignment
   */
  public requestMatch(): void {
    this.send({ type: 'match:ready' });
  }

  /**
   * Send chat message
   */
  public sendChatMessage(text: string): void {
    this.send({
      type: 'chat:message',
      data: { text },
    });
  }

  /**
   * Leave tournament
   */
  public leaveTournament(): void {
    this.intentionalDisconnect = true; // Set flag before leaving
    this.send({ type: 'tournament:leave' });
    this.disconnect();
  }

  /**
   * Disconnect from tournament
   */
  public disconnect(): void {
    this.intentionalDisconnect = true; // Set flag before disconnecting
    this.stopHeartbeat(); // Stop heartbeat before closing
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._connectionStatus$.next('disconnected');
  }

  /**
   * Reset cached state
   */
  public resetState(): void {
    this._tournamentState$.next(null);
    this.currentPlayerState = null;
    this.pendingMatchRequestId = null;
    this.lastAssignedMatchId = null;
  }

  /**
   * Heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing heartbeat first

    this.heartbeatSubscription = timer(30000, 30000) // Start after 30s, then every 30s
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.send({ type: 'ping' });
        } else {
          // Connection lost, stop heartbeat
          this.stopHeartbeat();
        }
      });
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatSubscription) {
      this.heartbeatSubscription.unsubscribe();
      this.heartbeatSubscription = null;
    }
  }

  /**
   * Find next match for current player
   */
  private findNextMatch(tournament: TournamentState): Match | null {
    if (!tournament.bracket) return null;

    const username = this.getCurrentUsername();
    const player = tournament.players.find(p => p.username === username);
    if (!player) return null;

    // Check semifinals
    for (const match of tournament.bracket.semifinals) {
      if (match.status === MatchStatus.PENDING || match.status === MatchStatus.IN_PROGRESS) {
        if (match.player1?.id === player.id || match.player2?.id === player.id) {
          return match;
        }
      }
    }

    // Check finals
    if (tournament.bracket.finals.status === MatchStatus.PENDING || tournament.bracket.finals.status === MatchStatus.IN_PROGRESS) {
      if (tournament.bracket.finals.player1?.id === player.id || tournament.bracket.finals.player2?.id === player.id) {
        return tournament.bracket.finals;
      }
    }

    // Check third place
    if (tournament.bracket.thirdPlace &&
        (tournament.bracket.thirdPlace.status === MatchStatus.PENDING || tournament.bracket.thirdPlace.status === MatchStatus.IN_PROGRESS)) {
      if (tournament.bracket.thirdPlace.player1?.id === player.id || tournament.bracket.thirdPlace.player2?.id === player.id) {
        return tournament.bracket.thirdPlace;
      }
    }

    return null;
  }

  private evaluateMatchRequest(state: TournamentState | null): void {
    if (!state) {
      return;
    }

    const match = this.findNextMatch(state);
    if (!match) {
      this.pendingMatchRequestId = null;
      return;
    }

    const matchId = match.id;
    if (!matchId) return;

    if (this.lastAssignedMatchId === matchId) {
      return;
    }

    if (this.pendingMatchRequestId === matchId) {
      return;
    }

    if (match.status === MatchStatus.PENDING || match.status === MatchStatus.IN_PROGRESS) {
      // console.log('[TournamentService] Requesting match assignment', { matchId, status: match.status });
      this.pendingMatchRequestId = matchId;
      this.requestMatch();
    }
  }

  /**
   * Get current username from auth
   */
  private getCurrentUsername(): string {
    const username = getUsernameFromAuth();
    if (!username) {
      // console.error('[TournamentService] No authenticated user found');
      return 'Guest';
    }
    return username;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
    this._tournamentState$.complete();
    this._connectionStatus$.complete();
    this._chatMessages$.complete();
    this._errors$.complete();
  }
}

// Singleton instance
export const remoteTournamentService = new RemoteTournamentService();
