import type { Tournament, TournamentStatus } from "./tournament/models.ts";

export interface RecentTournament {
    id: string;
    name: string;
    updatedAt: number;
    playerCount: number;
    roundCount: number;
    status: TournamentStatus;
}

export const channels = {
    getParameters: "getParameters",
    getRecentTournaments: "getRecentTournaments",
    getTournament: "getTournament",
    saveTournament: "saveTournament",
};

export interface Parameters {
    locale: string;
}

export interface OfflineLinkApi {
    getParameters: () => Promise<Parameters>;
    getRecentTournaments: () => Promise<RecentTournament[]>;
    getTournament: (id: string) => Promise<Tournament>;
    saveTournament: (tournament: Tournament) => Promise<void>;
}
