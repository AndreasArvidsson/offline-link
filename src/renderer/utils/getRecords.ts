import type { PlayerRecord, Tournament } from "../../common/models";
import { calculateRecord } from "./calculateRecord";

interface Records {
    get: (playerId: number) => PlayerRecord;
}

export function getRecords(tournament: Tournament): Records {
    const records = new Map(
        tournament.players.map((player) => [
            player.id,
            calculateRecord(player.id, tournament.rounds),
        ]),
    );

    return {
        get: (playerId) => {
            const record = records.get(playerId);

            if (record == null) {
                throw new Error(`Missing record for player ${playerId}`);
            }

            return record;
        },
    };
}
