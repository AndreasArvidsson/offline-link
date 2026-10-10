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
import { getRecords } from "../renderer/utils/getRecords.ts";

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

describe("getRecords", () => {
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
        const records = getRecords(event);

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

    it("rejects lookup of a player outside the tournament", () => {
        const records = getRecords(tournament([]));
        assert.throws(
            () => records.get(99),
            /Key "99" not found in lookup "Player records"/u,
        );
    });
});
