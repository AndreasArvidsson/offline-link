import { storage } from "./storage";
import type { Tournament } from "./tournament/models";

export function getTournament(id: string): Tournament {
    const tournament = storage.getTournaments().find((t) => t.id === id);

    if (tournament == null) {
        throw new Error(`Tournament with id ${id} not found`);
    }

    return tournament;
}
