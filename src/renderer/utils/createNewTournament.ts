import type { Tournament } from "../../common/models.ts";

export function createNewTournament(): Tournament {
    const timestamp = Date.now();
    return {
        version: 1,
        id: createTournamentId(timestamp),
        name: "",
        createdAt: timestamp,
        updatedAt: timestamp,
        startingTableNumber: 1,
        roundCount: 0,
        status: "NOT_STARTED",
        players: [],
        rounds: [],
    };
}

function createTournamentId(timestamp: number): string {
    return new Date(timestamp).toISOString().replaceAll(":", "-");
}
