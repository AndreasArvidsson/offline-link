export interface Tournament {
    version: 1;
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    status: "IN_PROGRESS" | "COMPLETED";
    players: Player[];
    rounds: Round[];
}

export interface Player {
    id: string;
    name: string;
    status: "ACTIVE" | "DROPPED";
    droppedAfterRound?: number;
}

export interface Round {
    number: number;
    createdAt: string;
    source: "MANUAL" | "AUTOMATIC" | "EVENTLINK";
    status: "IN_PROGRESS" | "COMPLETED";
    activePlayerIds: string[];
    pairings: Pairing[];
}

interface PairingMatch {
    type: "MATCH";
    id: string;
    table: number;
    player1Id: string;
    player2Id: string;
    result?: MatchResult;
}

interface PairingBye {
    type: "BYE";
    id: string;
    playerId: string;
}

export type Pairing = PairingMatch | PairingBye;

// Recording facts only. Official result legality and scoring belong to Phase 3.
export interface MatchResult {
    player1Wins: number;
    player2Wins: number;
    draws: number;
}
