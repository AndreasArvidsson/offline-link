import type { PlayerStanding } from "../../common/models";

export function getByeCandidates(players: PlayerStanding[]): PlayerStanding[] {
    // Standings are highest to lowest, so reverse them to prefer
    // the lowest-ranked player for the bye.
    return players.toReversed().toSorted((a, b) => a.byeCount - b.byeCount);
}
