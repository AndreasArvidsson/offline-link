import type { PlayerStanding } from "../../common/models";
import { findPerfectMatching } from "./findPerfectMatching";
import { getFreshOpponentGraph } from "./getFreshOpponentGraph";
import type { HavePlayed } from "./getHavePlayed";

type Match = [number, number];

// EventLink pairs the final Swiss round by rank, skipping previous opponents.
// https://wpn.wizards.com/en/news/eventlink-release-notes-september-28-2021
export function findPowerPairing(
    players: PlayerStanding[],
    havePlayed: HavePlayed,
): Match[] | undefined {
    const adjacency = getFreshOpponentGraph(players, havePlayed);
    const initialMatching = findPerfectMatching(adjacency);

    if (initialMatching == null) {
        return undefined;
    }

    const partners = players.map(() => -1);

    for (const [first, second] of initialMatching) {
        partners[first] = second;
        partners[second] = first;
    }

    const matches: Match[] = [];
    let remaining = players.map((_, index) => index);

    while (remaining.length > 0) {
        const [first, ...rest] = remaining;
        let nextRemaining: number[] | undefined;

        for (const opponent of rest) {
            if (
                havePlayed(
                    players[first].player.id,
                    players[opponent].player.id,
                )
            ) {
                continue;
            }

            const candidates = rest.filter((vertex) => vertex !== opponent);

            if (
                !updateRemainingMatching(
                    adjacency,
                    partners,
                    first,
                    opponent,
                    candidates,
                )
            ) {
                continue;
            }

            matches.push([
                players[first].player.id,
                players[opponent].player.id,
            ]);
            partners[first] = -1;
            partners[opponent] = -1;
            nextRemaining = candidates;
            break;
        }

        if (nextRemaining == null) {
            return undefined;
        }

        remaining = nextRemaining;
    }

    return matches;
}

// Reuse the known perfect matching, or repair it by pairing the selected
// players' former partners. Only harder cases need a new blossom search.
function updateRemainingMatching(
    adjacency: number[][],
    partners: number[],
    first: number,
    second: number,
    remaining: number[],
): boolean {
    if (partners[first] === second) {
        return true;
    }

    const firstPartner = partners[first];
    const secondPartner = partners[second];

    if (adjacency[firstPartner].includes(secondPartner)) {
        partners[firstPartner] = secondPartner;
        partners[secondPartner] = firstPartner;
        return true;
    }

    const indices = new Map(remaining.map((vertex, index) => [vertex, index]));
    const remainingGraph = remaining.map((vertex) => {
        const neighbors: number[] = [];

        for (const neighbor of adjacency[vertex]) {
            const index = indices.get(neighbor);
            if (index != null) {
                neighbors.push(index);
            }
        }

        return neighbors;
    });

    const matching = findPerfectMatching(remainingGraph);

    if (matching == null) {
        return false;
    }

    for (const [left, right] of matching) {
        partners[remaining[left]] = remaining[right];
        partners[remaining[right]] = remaining[left];
    }

    return true;
}
