import { BASE_URL } from "../config/config.js";
import { request, getHeaders } from "../utils/api.js";

const BLOCKCHAIN_BASE_URL = `${BASE_URL}/blockchain`;

export interface HealthResponse {
    status: string;
    message: string;
}

export interface Match {
    tournamentId: string;
    matchId: string;
    player1: string;
    player2: string;
    score1: string;
    score2: string;
    winner: string;
    startTime: string;
    endTime: string;
    finalMatch: boolean;
}

export interface MatchResponse {
    count: number;
    matches: Match[];
}

//API functions
export const getHealth = () =>
    request<HealthResponse>(`${BLOCKCHAIN_BASE_URL}/health`, {
        method: "GET",
        headers: getHeaders(),
    });

export const getPlayerMatches = (playerId: string) =>
    request<MatchResponse>(`${BLOCKCHAIN_BASE_URL}/players/${playerId}/matches`, {
        method: "GET",
        headers: getHeaders(),
    });