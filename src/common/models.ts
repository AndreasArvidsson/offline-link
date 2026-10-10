export interface Tournament {
    version: 1;
    // ISO timestamp. Also used as the filename.
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    roundCount: number;
    status: TournamentStatus;
    players: Player[];
    rounds: Round[];
}

export const tournamentStatuses = ["IN_PROGRESS", "COMPLETED"] as const;

export type TournamentStatus = (typeof tournamentStatuses)[number];

export interface Player {
    // Incrementing ID for the player.
    id: number;
    name: string;
}

export type ParticipationType = "DROPPED" | "DISQUALIFIED";

export interface PlayerParticipationChange {
    playerId: number;
    type: ParticipationType;
}

export interface Round {
    number: number;
    createdAt: number;
    status: "IN_PROGRESS" | "COMPLETED";
    participationChanges: PlayerParticipationChange[];
    pairings: Pairing[];
}

export interface PairingMatch {
    type: "MATCH";
    // Incrementing ID across all pairings in the tournament.
    id: number;
    table: number;
    player1Id: number;
    player2Id: number;
    result?: MatchResult;
}

export interface PairingBye {
    type: "BYE";
    // Incrementing ID across all pairings in the tournament.
    id: number;
    playerId: number;
}

export type Pairing = PairingMatch | PairingBye;

// A reported 0-0-0 result represents a double match loss. Unplayed intentional
// draws are recorded as 0-0-3; an unreported match has no result.
// A double match loss can happen when both players are absent.
export interface MatchResult {
    player1Wins: number;
    player2Wins: number;
    draws: number;
}

export interface PlayerRecord {
    opponentIds: number[];

    matchWins: number;
    matchLosses: number;
    matchDraws: number;

    // 3 points for a win, 1 point for a draw, 0 points for a loss.
    matchPoints: number;
    // Share of possible match points earned, calculated as: matchPoints / (3 * (matchWins + matchLosses + matchDraws)), with a minimum of 33%.
    matchWinPercentage: number;
    // Share of possible game points earned, calculated as: gamePoints / (3 * (gameWins + gameLosses + gameDraws)), with a minimum of 33%.
    gameWinPercentage: number;
}

export interface PlayerStanding {
    // Disqualified players remain visible but have no place in the standings.
    rank: number | null;
    player: Player;
    participationChange?: ParticipationType;
    byeCount: number;
    matchPoints: number;

    matchWins: number;
    matchLosses: number;
    matchDraws: number;

    // Opponent Match Win Percentage: Average of your opponents' match win percentages. Higher is better; this is the first tiebreaker.
    opponentMatchWinPercentage: number;
    // Game Win Percentage: Your game win percentages. Higher is better; this is the second tiebreaker.
    gameWinPercentage: number;
    // Opponent Game Win Percentage: Average of your opponents' game win percentages. Higher is better; this is the third tiebreaker.
    opponentGameWinPercentage: number;
}
