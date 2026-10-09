import type { Tournament } from "../common/models";
import { storage } from "../storage";

export function getTournament(id: string): Tournament {
    const tournament = storage.getTournaments().find((t) => t.id === id);

    if (tournament == null) {
        throw new Error(`Tournament with id ${id} not found`);
    }

    return tournament;
}
