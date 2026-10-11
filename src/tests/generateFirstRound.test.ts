import assert from "node:assert/strict";
import { describe, it } from "mocha";
import type { Player } from "../common/models.ts";
import { generateFirstRound } from "../renderer/utils/generateFirstRound.ts";

describe("generateFirstRound", () => {
    it("pairs every entrant exactly once and gives a bye only to odd fields", () => {
        for (const playerCount of [0, 1, 2, 5, 8]) {
            const players = Array.from({ length: playerCount }, (_, index) => ({
                id: index + 1,
                name: `Player ${index + 1}`,
            }));
            const round = generateFirstRound(players, 1, () => 0.5);
            const pairedPlayerIds = round.pairings.flatMap((pairing) =>
                pairing.type === "MATCH"
                    ? [pairing.player1Id, pairing.player2Id]
                    : [pairing.playerId],
            );

            assert.deepEqual(
                pairedPlayerIds.toSorted((a, b) => a - b),
                players.map((player) => player.id),
            );
            assert.equal(
                round.pairings.filter((pairing) => pairing.type === "BYE")
                    .length,
                playerCount % 2,
            );
            assert.equal(
                round.pairings.filter((pairing) => pairing.type === "MATCH")
                    .length,
                Math.floor(playerCount / 2),
            );
        }
    });

    it("assigns consecutive numeric IDs to matches and a bye without changing players", () => {
        const players: Player[] = [
            { id: 1, name: "Player 1" },
            { id: 2, name: "Player 2" },
            { id: 3, name: "Player 3" },
            { id: 4, name: "Player 4" },
            { id: 5, name: "Player 5" },
        ];
        const before = structuredClone(players);

        const round = generateFirstRound(players, 1, () => 0);

        assert.deepEqual(
            round.pairings.map((pairing) => pairing.id),
            [1, 2, 3],
        );
        assert.deepEqual(
            round.pairings.map((pairing) => pairing.type),
            ["MATCH", "MATCH", "BYE"],
        );
        assert.deepEqual(players, before);
    });

    it("generate first round with custom starting table number", () => {
        const players: Player[] = [
            { id: 1, name: "Player 1" },
            { id: 2, name: "Player 2" },
            { id: 3, name: "Player 3" },
            { id: 4, name: "Player 4" },
            { id: 5, name: "Player 5" },
        ];
        const round = generateFirstRound(players, 5, () => 0);

        assert.deepEqual(
            round.pairings.map((pairing) =>
                pairing.type === "MATCH" ? pairing.table : null,
            ),
            [5, 6, null],
        );
    });

    it("reserves locked tables before assigning ordinary matches without changing opponents or players", () => {
        const players: Player[] = Array.from({ length: 8 }, (_, index) => ({
            id: index + 1,
            name: `Player ${index + 1}`,
        }));
        players[2].lockedTableNumber = 5;
        players[6].lockedTableNumber = 99;
        const before = structuredClone(players);

        const round = generateFirstRound(players, 5, () => 0.999);

        assert.deepEqual(round.pairings, [
            { type: "MATCH", id: 1, table: 6, player1Id: 1, player2Id: 2 },
            { type: "MATCH", id: 2, table: 5, player1Id: 3, player2Id: 4 },
            { type: "MATCH", id: 3, table: 7, player1Id: 5, player2Id: 6 },
            { type: "MATCH", id: 4, table: 99, player1Id: 7, player2Id: 8 },
        ]);
        assert.deepEqual(players, before);
    });

    it("uses the lower table when locked players meet and leaves the other table available", () => {
        const players: Player[] = Array.from({ length: 10 }, (_, index) => ({
            id: index + 1,
            name: `Player ${index + 1}`,
        }));
        players[0].lockedTableNumber = 8;
        players[1].lockedTableNumber = 5;

        const round = generateFirstRound(players, 5, () => 0.999);

        assert.deepEqual(
            round.pairings.map((pairing) =>
                pairing.type === "MATCH" ? pairing.table : null,
            ),
            [5, 6, 7, 8, 9],
        );
    });

    it("reserves a locked table for a player receiving a bye", () => {
        const players: Player[] = Array.from({ length: 5 }, (_, index) => ({
            id: index + 1,
            name: `Player ${index + 1}`,
        }));
        players[4].lockedTableNumber = 5;

        const round = generateFirstRound(players, 5, () => 0.999);

        assert.deepEqual(round.pairings, [
            { type: "MATCH", id: 1, table: 6, player1Id: 1, player2Id: 2 },
            { type: "MATCH", id: 2, table: 7, player1Id: 3, player2Id: 4 },
            { type: "BYE", id: 3, playerId: 5 },
        ]);
    });
});
