import type { RecentTournament } from "./api";
import { storage } from "./storage";
import type { Tournament } from "./tournament/models";

export function getRecentTournaments(): RecentTournament[] {
    return storage.getTournaments().map(toRecentTournament);
}

function toRecentTournament(tournament: Tournament): RecentTournament {
    return {
        id: tournament.id,
        name: tournament.name,
        updatedAt: tournament.updatedAt,
        playerCount: tournament.players.length,
        roundCount: tournament.roundCount,
        status: tournament.status,
    };
}
