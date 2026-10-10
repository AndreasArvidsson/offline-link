import type { PlayerStanding } from "../../common/models";
import { findBestPairing } from "./findBestPairing";
import { findPerfectMatching } from "./findPerfectMatching";
import { findPowerPairing } from "./findPowerPairing";
import { getByeCandidates } from "./getByeCandidates";
import { getFreshOpponentGraph } from "./getFreshOpponentGraph";
import type { HavePlayed } from "./getHavePlayed";

type Match = [number, number];

interface RoundPairing {
    bye: PlayerStanding | undefined;
    matches: Match[];
}

export function findRoundPairing(
    players: PlayerStanding[],
    havePlayed: HavePlayed,
    isFinalRound: boolean,
): RoundPairing {
    const byeCandidates =
        players.length % 2 === 1 ? getByeCandidates(players) : [undefined];
    const findPairing = isFinalRound ? findPowerPairing : findBestPairing;

    for (const bye of byeCandidates) {
        const remaining = players.filter((player) => player !== bye);
        const matches = findPairing(remaining, havePlayed);

        if (matches != null) {
            return { bye, matches };
        }
    }

    return findFallbackPairing(
        players,
        byeCandidates,
        havePlayed,
        isFinalRound,
    );
}

function findFallbackPairing(
    players: PlayerStanding[],
    byeCandidates: (PlayerStanding | undefined)[],
    havePlayed: HavePlayed,
    isFinalRound: boolean,
): RoundPairing {
    // Try the fewest rematches first, then the preferred bye recipients.
    for (
        let rematches = 1;
        rematches <= Math.floor(players.length / 2);
        rematches++
    ) {
        for (const bye of byeCandidates) {
            const remaining = players.filter((player) => player !== bye);
            const playerCount = remaining.length;
            const matching = findRematchMatching(
                remaining,
                havePlayed,
                rematches,
            );

            if (matching == null) {
                continue;
            }

            if (isFinalRound) {
                return {
                    bye,
                    matches: findRankedRematchPairing(
                        remaining,
                        havePlayed,
                        rematches,
                    ),
                };
            }

            const matches: Match[] = [];
            const unmatched: number[] = [];

            for (const [first, second] of matching) {
                if (second >= playerCount) {
                    unmatched.push(first);
                } else {
                    matches.push([
                        remaining[first].player.id,
                        remaining[second].player.id,
                    ]);
                }
            }

            unmatched.sort((a, b) => a - b);

            for (let index = 0; index < unmatched.length; index += 2) {
                matches.push([
                    remaining[unmatched[index]].player.id,
                    remaining[unmatched[index + 1]].player.id,
                ]);
            }

            return { bye, matches };
        }
    }

    // Even fields always have a complete matching once all rematches are
    // allowed. Empty and single-player fields need no matches.
    return { bye: byeCandidates[0], matches: [] };
}

function findRematchMatching(
    players: PlayerStanding[],
    havePlayed: HavePlayed,
    rematches: number,
): Match[] | undefined {
    if (rematches < 0) {
        return undefined;
    }

    const adjacency = getFreshOpponentGraph(players, havePlayed);
    // Each pair of dummy vertices lets two players sit out the fresh
    // matching. Pair those players together as rematches afterwards.
    // Clamp the allowance when fewer players remain: allowing more rematches
    // than matches imposes no additional restriction.
    const allowance = Math.min(rematches, players.length / 2);
    const playerIndices = players.map((_, index) => index);

    for (let dummy = 0; dummy < allowance * 2; dummy++) {
        const dummyIndex = players.length + dummy;
        adjacency.push(playerIndices);
        for (let index = 0; index < players.length; index++) {
            adjacency[index].push(dummyIndex);
        }
    }

    return findPerfectMatching(adjacency);
}

function findRankedRematchPairing(
    players: PlayerStanding[],
    havePlayed: HavePlayed,
    rematches: number,
): Match[] {
    const matches: Match[] = [];
    let remaining = players;
    let remainingRematches = rematches;

    while (remaining.length > 0) {
        const [first, ...rest] = remaining;
        // As in power pairings, skip previous opponents first. Only consider
        // a rematch when no fresh opponent can preserve the minimum count.
        const opponents = rest.toSorted(
            (a, b) =>
                Number(havePlayed(first.player.id, a.player.id)) -
                Number(havePlayed(first.player.id, b.player.id)),
        );

        for (const opponent of opponents) {
            const repeated = Number(
                havePlayed(first.player.id, opponent.player.id),
            );
            const next = rest.filter((player) => player !== opponent);

            if (
                findRematchMatching(
                    next,
                    havePlayed,
                    remainingRematches - repeated,
                ) == null
            ) {
                continue;
            }

            matches.push([first.player.id, opponent.player.id]);
            remaining = next;
            remainingRematches -= repeated;
            break;
        }
    }

    return matches;
}
