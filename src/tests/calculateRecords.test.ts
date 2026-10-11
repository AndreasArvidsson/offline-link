/* oxlint-disable unicorn/max-nested-calls -- Keep tournament fixtures next to their assertions. */
import assert from "node:assert/strict";
import { describe, it } from "mocha";
import type {
    MatchResult,
    Pairing,
    PairingMatch,
    Round,
    Tournament,
} from "../common/models.ts";
import { calculateRecords } from "../renderer/utils/calculateRecords.ts";

let nextPairingId = 1;

function tournament(rounds: Round[]): Tournament {
    return {
        version: 1,
        id: "test",
        name: "Test",
        createdAt: 0,
        updatedAt: 0,
        roundCount: rounds.length,
        status: "IN_PROGRESS",
        players: [1, 2, 3, 4].map((id) => ({ id, name: `Player ${id}` })),
        rounds,
    };
}

function round(pairings: Pairing[]): Round {
    return {
        number: 1,
        createdAt: 0,
        status: "COMPLETED",
        participationChanges: [],
        pairings,
    };
}

function match(
    player1Id: number,
    player2Id: number,
    result?: MatchResult,
): PairingMatch {
    return {
        type: "MATCH",
        id: nextPairingId++,
        table: 1,
        player1Id,
        player2Id,
        result,
    };
}

describe("calculateRecords", () => {
    it("aggregates both players and preserves repeated opponents in encounter order", () => {
        const event = tournament([
            round([
                match(1, 2, { player1Wins: 2, player2Wins: 1, draws: 1 }),
                { type: "BYE", id: nextPairingId++, playerId: 3 },
            ]),
            round([match(3, 1, { player1Wins: 1, player2Wins: 1, draws: 1 })]),
            round([match(1, 2, { player1Wins: 0, player2Wins: 0, draws: 0 })]),
            round([match(2, 1, { player1Wins: 0, player2Wins: 2, draws: 0 })]),
            round([match(1, 3)]),
            {
                ...round([
                    match(1, 2, { player1Wins: 2, player2Wins: 0, draws: 0 }),
                    { type: "BYE", id: nextPairingId++, playerId: 4 },
                ]),
                status: "IN_PROGRESS",
            },
        ]);
        const before = structuredClone(event);
        const records = calculateRecords(event);

        assert.deepEqual(records.get(1), {
            opponentIds: [2, 3, 2, 2],
            matchWins: 2,
            matchLosses: 1,
            matchDraws: 1,
            matchPoints: 7,
            matchWinPercentage: 7 / 12,
            gameWinPercentage: 17 / 27,
        });
        assert.deepEqual(records.get(2), {
            opponentIds: [1, 1, 1],
            matchWins: 0,
            matchLosses: 3,
            matchDraws: 0,
            matchPoints: 0,
            matchWinPercentage: 0.33,
            gameWinPercentage: 0.33,
        });
        assert.deepEqual(records.get(3), {
            opponentIds: [1],
            matchWins: 1,
            matchLosses: 0,
            matchDraws: 1,
            matchPoints: 4,
            matchWinPercentage: 4 / 6,
            gameWinPercentage: 10 / 15,
        });
        assert.deepEqual(records.get(4), {
            opponentIds: [],
            matchWins: 0,
            matchLosses: 0,
            matchDraws: 0,
            matchPoints: 0,
            matchWinPercentage: 0.33,
            gameWinPercentage: 0.33,
        });
        assert.deepEqual(event, before);
    });

    it("returns empty records when the round count limit is zero", () => {
        const event = tournament([
            round([
                match(1, 2, { player1Wins: 2, player2Wins: 0, draws: 0 }),
                { type: "BYE", id: nextPairingId++, playerId: 3 },
            ]),
        ]);
        const records = calculateRecords(event, 0);

        for (const player of event.players) {
            assert.deepEqual(records.get(player.id), {
                opponentIds: [],
                matchWins: 0,
                matchLosses: 0,
                matchDraws: 0,
                matchPoints: 0,
                matchWinPercentage: 0.33,
                gameWinPercentage: 0.33,
            });
        }
    });

    it("excludes the displayed completed round and later rounds from historical records", () => {
        const event = tournament([
            round([match(1, 2, { player1Wins: 2, player2Wins: 0, draws: 0 })]),
            round([match(1, 3, { player1Wins: 1, player2Wins: 2, draws: 0 })]),
            round([match(1, 4, { player1Wins: 1, player2Wins: 1, draws: 1 })]),
        ]);
        const before = structuredClone(event);

        assert.deepEqual(calculateRecords(event, 1).get(1), {
            opponentIds: [2],
            matchWins: 1,
            matchLosses: 0,
            matchDraws: 0,
            matchPoints: 3,
            matchWinPercentage: 1,
            gameWinPercentage: 1,
        });
        assert.deepEqual(calculateRecords(event, 2).get(1), {
            opponentIds: [2, 3],
            matchWins: 1,
            matchLosses: 1,
            matchDraws: 0,
            matchPoints: 3,
            matchWinPercentage: 0.5,
            gameWinPercentage: 9 / 15,
        });
        assert.deepEqual(event, before);
    });

    it("does not include later completed rounds to replace an in-progress round within the limit", () => {
        const event = tournament([
            {
                ...round([
                    match(1, 2, { player1Wins: 2, player2Wins: 0, draws: 0 }),
                ]),
                status: "IN_PROGRESS",
            },
            round([match(1, 3, { player1Wins: 2, player2Wins: 0, draws: 0 })]),
        ]);
        const records = calculateRecords(event, 1);
        const emptyRecords = calculateRecords(event, 0);

        for (const player of event.players) {
            assert.deepEqual(
                records.get(player.id),
                emptyRecords.get(player.id),
            );
        }
    });

    it("includes all available rounds when the limit reaches or exceeds the round count", () => {
        const event = tournament([
            round([
                match(1, 2, { player1Wins: 2, player2Wins: 1, draws: 0 }),
                { type: "BYE", id: nextPairingId++, playerId: 3 },
            ]),
            round([match(1, 3, { player1Wins: 1, player2Wins: 1, draws: 1 })]),
        ]);
        const allRecords = calculateRecords(event);

        for (const limit of [event.rounds.length, event.rounds.length + 1]) {
            const records = calculateRecords(event, limit);
            for (const player of event.players) {
                assert.deepEqual(
                    records.get(player.id),
                    allRecords.get(player.id),
                );
            }
        }
    });

    it("rejects lookup of a player outside the tournament", () => {
        const records = calculateRecords(tournament([]));
        assert.throws(
            () => records.get(99),
            /Key "99" not found in lookup "Player records"/u,
        );
    });
});
