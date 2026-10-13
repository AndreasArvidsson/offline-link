import type { Tournament } from "../../common/models.ts";

export function createNewTournament(): Tournament {
    const timestamp = Date.now();
    return {
        version: 1,
        id: createTournamentId(timestamp),
        title: "",
        createdAt: timestamp,
        updatedAt: timestamp,
        pairingMethod: "SWISS",
        gameWinsPerMatch: "BO3",
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
