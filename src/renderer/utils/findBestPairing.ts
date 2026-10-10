import type { PlayerStanding } from "../../common/models";
import { findPerfectMatching } from "./findPerfectMatching";
import { getFreshOpponentGraph } from "./getFreshOpponentGraph";
import type { HavePlayed } from "./getHavePlayed";

type Match = [number, number];

const MAX_PAIRING_ATTEMPTS = 100_000;

interface PairingCost {
    maxDifference: number;
    totalDifference: number;
}

interface PairingSolution {
    matches: Match[];
    cost: PairingCost;
}

export function findBestPairing(
    players: PlayerStanding[],
    havePlayed: HavePlayed,
): Match[] | undefined {
    const adjacency = getFreshOpponentGraph(players, havePlayed);

    for (const [index, opponents] of adjacency.entries()) {
        adjacency[index] = opponents.toSorted(
            (a, b) =>
                getMatchDifference(players[index], players[a]) -
                getMatchDifference(players[index], players[b]),
        );
    }

    // Establish feasibility before spending the bounded score-optimization budget.
    const initialMatches = findPerfectMatching(adjacency);

    if (initialMatches == null) {
        return undefined;
    }

    let initialCost: PairingCost = { maxDifference: 0, totalDifference: 0 };

    for (const [first, second] of initialMatches) {
        initialCost = addMatchCost(
            initialCost,
            getMatchDifference(players[first], players[second]),
        );
    }

    let remainingAttempts = MAX_PAIRING_ATTEMPTS;
    let bestSolution: PairingSolution = {
        matches: initialMatches.map<Match>(([first, second]) => [
            players[first].player.id,
            players[second].player.id,
        ]),
        cost: initialCost,
    };

    const find = (
        remaining: number[],
        matches: Match[],
        cost: PairingCost,
    ): void => {
        if (remainingAttempts <= 0) {
            return;
        }

        remainingAttempts--;

        if (remaining.length === 0) {
            if (compareCosts(cost, bestSolution.cost) < 0) {
                bestSolution = {
                    matches,
                    cost,
                };
            }

            return;
        }

        if (compareCosts(cost, bestSolution.cost) >= 0) {
            return;
        }

        const [first, ...rest] = remaining;
        const available = new Set(rest);
        const opponents = adjacency[first].filter((opponent) =>
            available.has(opponent),
        );

        for (const opponent of opponents) {
            if (remainingAttempts <= 0) {
                break;
            }

            const nextCost = addMatchCost(
                cost,
                getMatchDifference(players[first], players[opponent]),
            );

            if (compareCosts(nextCost, bestSolution.cost) >= 0) {
                continue;
            }

            const nextRemaining = rest.filter((player) => player !== opponent);

            find(
                nextRemaining,
                [
                    ...matches,
                    [players[first].player.id, players[opponent].player.id],
                ],
                nextCost,
            );
        }
    };

    find(
        players.map((_, index) => index),
        [],
        {
            maxDifference: 0,
            totalDifference: 0,
        },
    );

    // A valid solution is useful even if the search budget was exhausted
    // before optimality could be proven.
    return bestSolution.matches;
}

function getMatchDifference(
    player1: PlayerStanding,
    player2: PlayerStanding,
): number {
    return Math.abs(player1.matchPoints - player2.matchPoints);
}

function compareCosts(a: PairingCost, b: PairingCost): number {
    return (
        a.maxDifference - b.maxDifference ||
        a.totalDifference - b.totalDifference
    );
}

function addMatchCost(cost: PairingCost, difference: number): PairingCost {
    return {
        maxDifference: Math.max(cost.maxDifference, difference),
        totalDifference: cost.totalDifference + difference,
    };
}
