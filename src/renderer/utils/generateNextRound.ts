import type {
    Pairing,
    PlayerStanding,
    Round,
    Tournament,
} from "../../common/models";
import { calculateStandings } from "./calculateStandings";
import { findPerfectMatching } from "./findPerfectMatching";
import { havePlayed } from "./havePlayed";

const MAX_PAIRING_ATTEMPTS = 100_000;

type Match = [number, number];

interface PairingCost {
    maxDifference: number;
    totalDifference: number;
}

interface PairingSolution {
    matches: Match[];
    cost: PairingCost;
}

export function generateNextRound(tournament: Tournament): Round {
    if (tournament.rounds.length >= tournament.roundCount) {
        throw new Error("All tournament rounds have already been generated");
    }
    if (tournament.rounds.some((round) => round.status !== "COMPLETED")) {
        throw new Error(
            "Complete the current round before generating the next round",
        );
    }

    const players = calculateStandings(tournament).filter(
        (standing) => standing.participationChange == null,
    );

    const byeCandidates = getByeCandidates(players);
    const findPairing =
        tournament.rounds.length + 1 === tournament.roundCount
            ? findPowerPairing
            : findBestPairing;

    let bye: PlayerStanding | undefined;
    let matches: Match[] | undefined;

    if (players.length % 2 === 0) {
        matches = findPairing(players, tournament.rounds);
    } else {
        for (const candidate of byeCandidates) {
            const remaining = players.filter((player) => player !== candidate);

            const solution = findPairing(remaining, tournament.rounds);

            if (solution != null) {
                bye = candidate;
                matches = solution;
                break;
            }
        }
    }

    if (matches == null) {
        const fallback = findFallbackPairing(
            players,
            byeCandidates,
            tournament.rounds,
            tournament.rounds.length + 1 === tournament.roundCount,
        );
        bye = fallback.bye;
        matches = fallback.matches;
    }

    const highestPairingId = tournament.rounds.reduce(
        (highest, round) =>
            round.pairings.reduce(
                (highestInRound, pairing) =>
                    Math.max(highestInRound, pairing.id),
                highest,
            ),
        0,
    );
    let nextPairingId = highestPairingId + 1;

    const pairings: Pairing[] = matches.map(
        ([player1Id, player2Id], index) => ({
            type: "MATCH",
            id: nextPairingId++,
            table: index + 1,
            player1Id,
            player2Id,
        }),
    );

    if (bye != null) {
        pairings.push({
            type: "BYE",
            id: nextPairingId++,
            playerId: bye.player.id,
        });
    }

    return {
        number: tournament.rounds.length + 1,
        createdAt: Date.now(),
        status: "IN_PROGRESS",
        participationChanges: [],
        pairings,
    };
}

function getByeCandidates(players: PlayerStanding[]): PlayerStanding[] {
    // Standings are highest to lowest, so reverse them to prefer
    // the lowest-ranked player for the bye.
    return players.toReversed().toSorted((a, b) => a.byeCount - b.byeCount);
}

function findFallbackPairing(
    players: PlayerStanding[],
    byeCandidates: PlayerStanding[],
    rounds: Round[],
    finalRound: boolean,
): { bye: PlayerStanding | undefined; matches: Match[] } {
    const candidates = players.length % 2 === 0 ? [undefined] : byeCandidates;

    // Try the fewest rematches first, then the preferred bye recipients.
    for (
        let rematches = 1;
        rematches <= Math.floor(players.length / 2);
        rematches++
    ) {
        for (const bye of candidates) {
            const remaining = players.filter((player) => player !== bye);
            const playerCount = remaining.length;
            const matching = findRematchMatching(remaining, rounds, rematches);
            if (matching === undefined) {
                continue;
            }

            if (finalRound) {
                return {
                    bye,
                    matches: findRankedRematchPairing(
                        remaining,
                        rounds,
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
    return { bye: candidates[0], matches: [] };
}

function findRematchMatching(
    players: PlayerStanding[],
    rounds: Round[],
    rematches: number,
): Match[] | undefined {
    if (rematches < 0) {
        return undefined;
    }
    const adjacency = getFreshOpponentGraph(players, rounds);
    // Each pair of dummy vertices lets two players sit out the fresh
    // matching. Pair those players together as rematches afterwards.
    // Clamp the allowance when fewer players remain: allowing more rematches
    // than matches imposes no additional restriction.
    const allowance = Math.min(rematches, players.length / 2);
    for (let dummy = 0; dummy < allowance * 2; dummy++) {
        const dummyIndex = players.length + dummy;
        adjacency.push(players.map((_, index) => index));
        for (let index = 0; index < players.length; index++) {
            adjacency[index].push(dummyIndex);
        }
    }
    return findPerfectMatching(adjacency);
}

function findRankedRematchPairing(
    players: PlayerStanding[],
    rounds: Round[],
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
                Number(havePlayed(first.player.id, a.player.id, rounds)) -
                Number(havePlayed(first.player.id, b.player.id, rounds)),
        );
        for (const opponent of opponents) {
            const repeated = Number(
                havePlayed(first.player.id, opponent.player.id, rounds),
            );
            const next = rest.filter((player) => player !== opponent);
            if (
                findRematchMatching(
                    next,
                    rounds,
                    remainingRematches - repeated,
                ) === undefined
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

function getFreshOpponentGraph(
    players: PlayerStanding[],
    rounds: Round[],
): number[][] {
    const adjacency: number[][] = players.map(() => []);
    for (let first = 0; first < players.length; first++) {
        for (let second = first + 1; second < players.length; second++) {
            if (
                !havePlayed(
                    players[first].player.id,
                    players[second].player.id,
                    rounds,
                )
            ) {
                adjacency[first].push(second);
                adjacency[second].push(first);
            }
        }
    }

    return adjacency;
}

// EventLink pairs the final Swiss round by rank, skipping previous opponents.
// https://wpn.wizards.com/en/news/eventlink-release-notes-september-28-2021
function findPowerPairing(
    players: PlayerStanding[],
    rounds: Round[],
): Match[] | undefined {
    const adjacency = getFreshOpponentGraph(players, rounds);
    const initialMatching = findPerfectMatching(adjacency);
    if (initialMatching === undefined) {
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
            if (!adjacency[first].includes(opponent)) {
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

        if (nextRemaining === undefined) {
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
            if (index !== undefined) {
                neighbors.push(index);
            }
        }
        return neighbors;
    });
    const matching = findPerfectMatching(remainingGraph);
    if (matching === undefined) {
        return false;
    }
    for (const [left, right] of matching) {
        partners[remaining[left]] = remaining[right];
        partners[remaining[right]] = remaining[left];
    }
    return true;
}

function findBestPairing(
    players: PlayerStanding[],
    rounds: Round[],
): Match[] | undefined {
    const adjacency = getFreshOpponentGraph(players, rounds);
    for (const [index, opponents] of adjacency.entries()) {
        adjacency[index] = opponents.toSorted(
            (a, b) =>
                getMatchDifference(players[index], players[a]) -
                getMatchDifference(players[index], players[b]),
        );
    }

    // Establish feasibility before spending the bounded score-optimization budget.
    const initialMatches = findPerfectMatching(adjacency);
    if (initialMatches === undefined) {
        return undefined;
    }

    const initialCost: PairingCost = { maxDifference: 0, totalDifference: 0 };
    for (const [first, second] of initialMatches) {
        const difference = getMatchDifference(players[first], players[second]);
        initialCost.maxDifference = Math.max(
            initialCost.maxDifference,
            difference,
        );
        initialCost.totalDifference += difference;
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

        if (cannotBeat(cost, bestSolution.cost)) {
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

            const difference = getMatchDifference(
                players[first],
                players[opponent],
            );

            const nextCost: PairingCost = {
                maxDifference: Math.max(cost.maxDifference, difference),
                totalDifference: cost.totalDifference + difference,
            };

            if (cannotBeat(nextCost, bestSolution.cost)) {
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

function cannotBeat(cost: PairingCost, bestCost: PairingCost): boolean {
    if (cost.maxDifference > bestCost.maxDifference) {
        return true;
    }

    return (
        cost.maxDifference === bestCost.maxDifference &&
        cost.totalDifference >= bestCost.totalDifference
    );
}
