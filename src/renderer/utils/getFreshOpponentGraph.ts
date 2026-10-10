import type { PlayerStanding } from "../../common/models";
import type { HavePlayed } from "./getHavePlayed";

export function getFreshOpponentGraph(
    players: PlayerStanding[],
    havePlayed: HavePlayed,
): number[][] {
    const adjacency: number[][] = players.map(() => []);

    for (let first = 0; first < players.length; first++) {
        for (let second = first + 1; second < players.length; second++) {
            if (
                !havePlayed(players[first].player.id, players[second].player.id)
            ) {
                adjacency[first].push(second);
                adjacency[second].push(first);
            }
        }
    }

    return adjacency;
}
