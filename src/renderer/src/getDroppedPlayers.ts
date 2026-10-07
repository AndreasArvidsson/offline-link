import type { Tournament } from "../../common/models";

export function getDroppedPlayers(tournament: Tournament): Set<number> {
    return new Set(
        tournament.rounds.flatMap((round) =>
            round.status === "COMPLETED" ? round.droppedPlayerIds : [],
        ),
    );
}
