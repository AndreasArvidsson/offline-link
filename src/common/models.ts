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

export interface Round {
    number: number;
    createdAt: number;
    status: "IN_PROGRESS" | "COMPLETED";
    droppedPlayerIds: number[];
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

export interface PlayerStanding {
    player: Player;
    dropped: boolean;
    matchPoints: number;

    wins: number;
    losses: number;
    draws: number;

    // Opponent Match Win Percentage: How well your opponents performed in their matches, averaged once per match you played against them. Each opponent's percentage is their match points divided by the maximum possible points, including their byes, with a minimum of 33%. Your own byes add no opponent. Higher is better; this is the first tiebreaker after match points.
    opponentMatchWinPercentage: number;
    // Game Win Percentage: The share of possible game points you earned across individual games. A game win earns 3 points, a draw earns 1, and a loss earns 0. Divide your game points by 3 times the number of games played, with a minimum of 33%. A bye counts as two game wins. Higher is better; this is the second tiebreaker.
    gameWinPercentage: number;
    // Opponent Game Win Percentage: How well your opponents performed in their individual games, averaged once per match you played against them. Each opponent's game win percentage includes their byes and has a minimum of 33% for this calculation. Your own byes add no opponent. Higher is better; this is the third tiebreaker.
    opponentGameWinPercentage: number;
}
