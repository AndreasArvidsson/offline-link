import type { Tournament } from "../../common/models.ts";

export function createNewTournament(): Tournament {
    const timestamp = Date.now();
    return {
        version: 1,
        id: createTournamentId(timestamp),
        name: "",
        createdAt: timestamp,
        updatedAt: timestamp,
        roundCount: 0,
        status: "IN_PROGRESS",
        players: [],
        rounds: [],
    };
}

function createTournamentId(timestamp: number): string {
    return new Date(timestamp).toISOString().replaceAll(":", "-");
}
