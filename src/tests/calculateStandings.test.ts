/* oxlint-disable unicorn/max-nested-calls -- Keep tournament fixtures next to their assertions. */
import assert from "node:assert/strict";
import { describe, it } from "mocha";
import type {
    Pairing,
    PairingMatch,
    PlayerStanding,
    Round,
    Tournament,
} from "../common/models.ts";
import { calculateStandings } from "../renderer/src/calculateStandings.ts";

function tournament(rounds: Round[] = []): Tournament {
    return {
        version: 1,
        id: "test",
        name: "Test",
        createdAt: 0,
        updatedAt: 0,
        roundCount: rounds.length,
        status: "IN_PROGRESS",
        players: [1, 2, 3].map((id) => ({ id, name: `Player ${id}` })),
        rounds,
    };
}

function round(pairings: Pairing[], droppedPlayerIds: number[] = []): Round {
    return {
        number: 1,
        createdAt: 0,
        status: "COMPLETED",
        droppedPlayerIds,
        pairings,
    };
}

function match(
    player1Id: number,
    player2Id: number,
    player1Wins: number,
    player2Wins: number,
    draws = 0,
): PairingMatch {
    return {
        type: "MATCH",
        id: "match",
        table: 1,
        player1Id,
        player2Id,
        result: { player1Wins, player2Wins, draws },
    };
}

function standing(
    standings: PlayerStanding[],
    playerId: number,
): PlayerStanding {
    const result = standings.find((item) => item.player.id === playerId);
    assert.ok(result);
    return result;
}

function close(actual: number, expected: number): void {
    assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);
}

describe("calculateStandings", () => {
    it("handles no rounds without NaN and preserves fully tied player order", () => {
        const standings = calculateStandings(tournament());
        assert.deepEqual(
            standings.map((item) => item.player.id),
            [1, 2, 3],
        );
        assert.deepEqual(standings[0], {
            player: { id: 1, name: "Player 1" },
            dropped: false,
            matchPoints: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            opponentMatchWinPercentage: 0,
            gameWinPercentage: 0,
            opponentGameWinPercentage: 0,
        });
        assert.deepEqual(
            calculateStandings({ ...tournament(), players: [] }),
            [],
        );
    });

    it("counts match records, game draws, byes, and dropped opponents", () => {
        const standings = calculateStandings(
            tournament([
                round([
                    match(1, 2, 2, 1, 1),
                    { type: "BYE", id: "bye", playerId: 3 },
                ]),
                round([match(3, 1, 1, 1, 1)], [2]),
            ]),
        );
        assert.deepEqual(
            standings.map((item) => item.player.id),
            [3, 1, 2],
        );
        const first = standing(standings, 1);
        assert.equal(first.matchPoints, 4);
        assert.deepEqual([first.wins, first.losses, first.draws], [1, 0, 1]);
        close(first.gameWinPercentage, 11 / 21);
        close(first.opponentMatchWinPercentage, (0.33 + 1 / 3) / 2);
        close(first.opponentGameWinPercentage, (1 / 3 + 4 / 9) / 2);
        const byePlayer = standing(standings, 3);
        close(byePlayer.gameWinPercentage, 10 / 15);
        close(byePlayer.opponentMatchWinPercentage, 4 / 6);
        close(byePlayer.opponentGameWinPercentage, 11 / 21);
        assert.equal(standing(standings, 2).dropped, true);
    });

    it("ignores in-progress rounds and missing results", () => {
        const missing = match(1, 2, 2, 0);
        delete missing.result;
        const pending = round(
            [match(1, 2, 2, 0), { type: "BYE", id: "bye", playerId: 3 }],
            [1],
        );
        pending.status = "IN_PROGRESS";
        assert.deepEqual(
            calculateStandings(tournament([round([missing]), pending])),
            calculateStandings(tournament()),
        );
    });

    it("excludes opponents' bye wins from both opponent tiebreakers", () => {
        const standings = calculateStandings(
            tournament([
                round([
                    match(1, 3, 2, 0),
                    { type: "BYE", id: "bye2", playerId: 2 },
                ]),
                round([
                    match(1, 2, 2, 0),
                    { type: "BYE", id: "bye3", playerId: 3 },
                ]),
            ]),
        );
        const winner = standing(standings, 1);
        close(winner.opponentMatchWinPercentage, 0.33);
        close(winner.opponentGameWinPercentage, 0.33);
        const byePlayer = standing(standings, 2);
        assert.equal(byePlayer.matchPoints, 3);
        assert.deepEqual(
            [byePlayer.wins, byePlayer.losses, byePlayer.draws],
            [1, 1, 0],
        );
        close(byePlayer.gameWinPercentage, 0.5);
    });

    it("applies percentage floors and weights repeated opponents by encounter", () => {
        const standings = calculateStandings(
            tournament([
                round([match(1, 2, 2, 0)]),
                round([match(1, 2, 2, 0)]),
                round([match(3, 1, 2, 0)]),
            ]),
        );
        const first = standing(standings, 1);
        close(first.opponentMatchWinPercentage, (0.33 + 0.33 + 1) / 3);
        close(first.opponentGameWinPercentage, (0.33 + 0.33 + 1) / 3);
        assert.equal(standing(standings, 2).gameWinPercentage, 0.33);
        assert.deepEqual(
            standings.map((item) => item.player.id),
            [1, 3, 2],
        );
    });

    it("floors both own and opponent percentages below 33%", () => {
        const standings = calculateStandings(
            tournament([
                round([match(1, 2, 0, 2)]),
                round([match(1, 2, 0, 2)]),
                round([match(1, 2, 0, 2)]),
                round([match(1, 3, 2, 1)]),
            ]),
        );
        close(standing(standings, 1).gameWinPercentage, 0.33);
        close(standing(standings, 2).opponentMatchWinPercentage, 0.33);
        close(standing(standings, 2).opponentGameWinPercentage, 0.33);
    });

    it("floors own and opponent percentages for a reported zero-game draw", () => {
        const standings = calculateStandings(
            tournament([round([match(1, 2, 0, 0)])]),
        );
        assert.equal(standing(standings, 1).gameWinPercentage, 0.33);
        assert.equal(standing(standings, 2).opponentGameWinPercentage, 0.33);
    });

    it("ignores partially reported rounds after a completed round", () => {
        const completed = round([match(1, 2, 2, 1)], [2]);
        const pending = round([match(3, 1, 2, 0)], [1]);
        pending.status = "IN_PROGRESS";
        assert.deepEqual(
            calculateStandings(tournament([completed, pending])),
            calculateStandings(tournament([completed])),
        );
    });

    it("preserves tied player order when game-win percentages are both below 33%", () => {
        const standings = calculateStandings(
            tournament([
                round([match(1, 3, 1, 2)]),
                round([match(1, 3, 0, 2)]),
                round([match(2, 3, 1, 2)]),
                round([match(2, 3, 0, 1)]),
            ]),
        );
        assert.deepEqual(
            standings.map((item) => item.player.id),
            [3, 1, 2],
        );
        close(standing(standings, 1).gameWinPercentage, 0.33);
        close(standing(standings, 2).gameWinPercentage, 0.33);
    });

    it("ranks game-win percentage after equal match points and opponent match-win percentage", () => {
        const standings = calculateStandings(
            tournament([
                round([match(1, 2, 2, 0)]),
                round([match(2, 3, 2, 0)]),
                round([match(3, 1, 2, 1)]),
            ]),
        );
        assert.deepEqual(
            standings.map((item) => item.player.id),
            [1, 2, 3],
        );
        close(standing(standings, 1).gameWinPercentage, 3 / 5);
        close(standing(standings, 2).gameWinPercentage, 1 / 2);
        close(standing(standings, 3).gameWinPercentage, 2 / 5);
    });

    it("uses game-win percentage when equal opponent averages have rounding noise", () => {
        const event = tournament([
            round([
                match(1, 2, 0, 2),
                match(3, 4, 0, 2),
                match(5, 6, 1, 1),
                match(7, 8, 1, 2),
            ]),
            round([
                match(2, 4, 1, 1),
                match(8, 5, 1, 2),
                match(6, 7, 0, 2),
                match(1, 3, 1, 2),
            ]),
            round([
                match(4, 5, 1, 2),
                match(2, 8, 0, 2),
                match(3, 7, 1, 1),
                match(6, 1, 1, 1),
            ]),
        ]);
        event.players = Array.from({ length: 8 }, (_, index) => ({
            id: index + 1,
            name: `Player ${index + 1}`,
        }));
        const standings = calculateStandings(event);
        const second = standing(standings, 2);
        const seventh = standing(standings, 7);
        assert.equal(second.matchPoints, 4);
        assert.equal(seventh.matchPoints, 4);
        close(second.opponentMatchWinPercentage, 1297 / 2700);
        close(seventh.opponentMatchWinPercentage, 1297 / 2700);
        close(second.gameWinPercentage, 1 / 2);
        close(seventh.gameWinPercentage, 4 / 7);
        const order = standings.map((item) => item.player.id);
        assert.ok(order.indexOf(7) < order.indexOf(2));
        const reversedRounds = calculateStandings({
            ...event,
            rounds: event.rounds.toReversed(),
        });
        assert.deepEqual(
            reversedRounds.map((item) => item.player.id),
            order,
        );
    });

    it("uses opponent game-win percentage as the final tiebreaker", () => {
        const event = tournament([
            round([match(1, 3, 1, 1), match(2, 4, 1, 1)]),
            round([match(3, 4, 2, 1)]),
            round([match(4, 3, 2, 0)]),
        ]);
        event.players.push({ id: 4, name: "Player 4" });
        const standings = calculateStandings(event);
        assert.deepEqual(
            standings.map((item) => item.player.id),
            [4, 3, 2, 1],
        );
        close(standing(standings, 1).opponentGameWinPercentage, 3 / 7);
        close(standing(standings, 2).opponentGameWinPercentage, 4 / 7);
    });

    it("gives a bye-only player a win and game points without inventing an opponent", () => {
        const result = standing(
            calculateStandings(
                tournament([round([{ type: "BYE", id: "bye", playerId: 1 }])]),
            ),
            1,
        );
        assert.deepEqual(result, {
            player: { id: 1, name: "Player 1" },
            dropped: false,
            matchPoints: 3,
            wins: 1,
            losses: 0,
            draws: 0,
            opponentMatchWinPercentage: 0,
            gameWinPercentage: 1,
            opponentGameWinPercentage: 0,
        });
    });
});
