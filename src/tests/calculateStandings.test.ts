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
import { calculateStandings } from "../renderer/utils/calculateStandings.ts";

let nextPairingId = 1;

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
        participationChanges: droppedPlayerIds.map((playerId) => ({
            playerId,
            type: "DROPPED",
        })),
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
        id: nextPairingId++,
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
        const expected: PlayerStanding = {
            rank: 1,
            participationChange: undefined,
            player: { id: 1, name: "Player 1" },
            byeCount: 0,
            matchPoints: 0,
            matchWins: 0,
            matchLosses: 0,
            matchDraws: 0,
            opponentMatchWinPercentage: 0,
            gameWinPercentage: 0.33,
            opponentGameWinPercentage: 0,
        };
        assert.deepEqual(standings[0], expected);
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
                    { type: "BYE", id: nextPairingId++, playerId: 3 },
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
        assert.deepEqual(
            [first.matchWins, first.matchLosses, first.matchDraws],
            [1, 0, 1],
        );
        close(first.gameWinPercentage, 11 / 21);
        close(first.opponentMatchWinPercentage, (0.33 + 4 / 6) / 2);
        close(first.opponentGameWinPercentage, (1 / 3 + 10 / 15) / 2);
        const byePlayer = standing(standings, 3);
        close(byePlayer.gameWinPercentage, 10 / 15);
        close(byePlayer.opponentMatchWinPercentage, 4 / 6);
        close(byePlayer.opponentGameWinPercentage, 11 / 21);
        assert.equal(standing(standings, 2).participationChange, "DROPPED");
    });

    it("counts assigned byes but ignores in-progress scores and missing results", () => {
        const missing = match(1, 2, 2, 0);
        delete missing.result;
        const pending = round(
            [
                match(1, 2, 2, 0),
                { type: "BYE", id: nextPairingId++, playerId: 3 },
            ],
            [1],
        );
        pending.status = "IN_PROGRESS";
        const expected = calculateStandings(tournament());
        standing(expected, 3).byeCount = 1;
        assert.deepEqual(
            calculateStandings(tournament([round([missing]), pending])),
            expected,
        );
    });

    it("includes opponents' bye wins in both opponent tiebreakers", () => {
        const standings = calculateStandings(
            tournament([
                round([
                    match(1, 3, 2, 0),
                    { type: "BYE", id: nextPairingId++, playerId: 2 },
                ]),
                round([
                    match(1, 2, 2, 0),
                    { type: "BYE", id: nextPairingId++, playerId: 3 },
                ]),
            ]),
        );
        const winner = standing(standings, 1);
        close(winner.opponentMatchWinPercentage, 0.5);
        close(winner.opponentGameWinPercentage, 0.5);
        const byePlayer = standing(standings, 2);
        assert.equal(byePlayer.matchPoints, 3);
        assert.deepEqual(
            [byePlayer.matchWins, byePlayer.matchLosses, byePlayer.matchDraws],
            [1, 1, 0],
        );
        close(byePlayer.gameWinPercentage, 0.5);
    });

    it("uses the Appendix C match-win percentage for a 3-2 record including a bye", () => {
        // Appendix C: 9 match points over 5 rounds, including the first-round bye.
        const event = tournament([
            round([{ type: "BYE", id: nextPairingId++, playerId: 2 }]),
            round([match(1, 2, 2, 1)], [1]),
            round([match(2, 3, 2, 0)]),
            round([match(2, 4, 2, 1)]),
            round([match(5, 2, 2, 1)], [2]),
        ]);
        event.players.push(
            { id: 4, name: "Player 4" },
            { id: 5, name: "Player 5" },
        );
        const standings = calculateStandings(event);
        const opponent = standing(standings, 2);
        assert.equal(opponent.matchPoints, 9);
        assert.deepEqual(
            [opponent.matchWins, opponent.matchLosses, opponent.matchDraws],
            [3, 2, 0],
        );
        assert.equal(opponent.participationChange, "DROPPED");
        close(standing(standings, 1).opponentMatchWinPercentage, 9 / 15);
        close(standing(standings, 1).opponentGameWinPercentage, 24 / 39);
    });

    it("ranks players using their opponents' full records including byes", () => {
        const event = tournament([
            round([
                match(2, 5, 2, 1),
                match(1, 4, 1, 2),
                { type: "BYE", id: nextPairingId++, playerId: 3 },
            ]),
            round([
                match(4, 5, 0, 2),
                match(2, 3, 0, 2),
                { type: "BYE", id: nextPairingId++, playerId: 1 },
            ]),
            round([
                match(1, 3, 2, 0),
                match(2, 4, 0, 2),
                { type: "BYE", id: nextPairingId++, playerId: 5 },
            ]),
        ]);
        event.players.push(
            { id: 4, name: "Player 4" },
            { id: 5, name: "Player 5" },
        );
        const standings = calculateStandings(event);
        assert.deepEqual(
            standings.map((item) => item.player.id),
            [1, 4, 5, 3, 2],
        );
        close(standing(standings, 4).opponentMatchWinPercentage, 5 / 9);
        close(standing(standings, 5).opponentMatchWinPercentage, 0.5);
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

    it("scores a 0-0-0 result as a match loss for both players", () => {
        const standings = calculateStandings(
            tournament([round([match(1, 2, 0, 0)])]),
        );
        for (const playerId of [1, 2]) {
            const result = standing(standings, playerId);
            assert.equal(result.matchPoints, 0);
            assert.deepEqual(
                [result.matchWins, result.matchLosses, result.matchDraws],
                [0, 1, 0],
            );
            assert.equal(result.opponentMatchWinPercentage, 0.33);
            assert.equal(result.gameWinPercentage, 0.33);
            assert.equal(result.opponentGameWinPercentage, 0.33);
        }
    });

    it("includes double match losses in match records and opponent tiebreakers without adding games", () => {
        const firstRound = round([match(1, 3, 2, 1), match(2, 4, 2, 0)]);
        const event = tournament([firstRound]);
        event.players.push({ id: 4, name: "Player 4" });
        const before = calculateStandings(event);
        event.rounds.push(
            round([match(1, 2, 0, 0), match(3, 4, 2, 1)], [1, 2]),
        );
        const after = calculateStandings(event);
        for (const playerId of [1, 2]) {
            const result = standing(after, playerId);
            assert.equal(result.matchPoints, 3);
            assert.deepEqual(
                [result.matchWins, result.matchLosses, result.matchDraws],
                [1, 1, 0],
            );
            assert.equal(result.participationChange, "DROPPED");
            assert.equal(
                result.gameWinPercentage,
                standing(before, playerId).gameWinPercentage,
            );
        }
        close(standing(after, 1).gameWinPercentage, 2 / 3);
        close(standing(after, 2).gameWinPercentage, 1);
        close(standing(after, 1).opponentMatchWinPercentage, 1 / 2);
        close(standing(after, 1).opponentGameWinPercentage, 3 / 4);
        close(
            standing(after, 2).opponentMatchWinPercentage,
            (0.33 + 1 / 2) / 2,
        );
        close(standing(after, 2).opponentGameWinPercentage, (0.33 + 2 / 3) / 2);
        close(
            standing(after, 3).opponentMatchWinPercentage,
            (1 / 2 + 0.33) / 2,
        );
    });

    it("scores a 0-0-1 result as an actual game and match draw", () => {
        const standings = calculateStandings(
            tournament([round([match(1, 2, 0, 0, 1)])]),
        );
        for (const playerId of [1, 2]) {
            const result = standing(standings, playerId);
            assert.equal(result.matchPoints, 1);
            assert.deepEqual(
                [result.matchWins, result.matchLosses, result.matchDraws],
                [0, 0, 1],
            );
            close(result.opponentMatchWinPercentage, 1 / 3);
            close(result.gameWinPercentage, 1 / 3);
            close(result.opponentGameWinPercentage, 1 / 3);
        }
    });

    it("scores an intentional 0-0-3 draw using its reported game draws", () => {
        const standings = calculateStandings(
            tournament([round([match(1, 2, 0, 0, 3)])]),
        );
        for (const playerId of [1, 2]) {
            const result = standing(standings, playerId);
            assert.equal(result.matchPoints, 1);
            assert.deepEqual(
                [result.matchWins, result.matchLosses, result.matchDraws],
                [0, 0, 1],
            );
            close(result.opponentMatchWinPercentage, 1 / 3);
            close(result.gameWinPercentage, 1 / 3);
            close(result.opponentGameWinPercentage, 1 / 3);
        }
    });

    it("ignores pending double match losses after a completed round", () => {
        const completed = round([match(1, 2, 2, 1)], [2]);
        const pending = round([match(3, 1, 0, 0)], [1]);
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
        const actual = standing(
            calculateStandings(
                tournament([
                    round([{ type: "BYE", id: nextPairingId++, playerId: 1 }]),
                ]),
            ),
            1,
        );
        const expected: PlayerStanding = {
            rank: 1,
            participationChange: undefined,
            player: { id: 1, name: "Player 1" },
            byeCount: 1,
            matchPoints: 3,
            matchWins: 1,
            matchLosses: 0,
            matchDraws: 0,
            opponentMatchWinPercentage: 0,
            gameWinPercentage: 1,
            opponentGameWinPercentage: 0,
        };
        assert.deepEqual(actual, expected);
    });

    it("moves a disqualified winner below ranked players without changing records or tiebreakers", () => {
        const event = tournament([round([match(1, 2, 2, 0)])]);
        const before = calculateStandings(event);
        event.rounds[0].participationChanges = [
            { playerId: 1, type: "DISQUALIFIED" },
        ];
        const snapshot = structuredClone(event);
        const after = calculateStandings(event);

        assert.deepEqual(
            after.map((item) => [item.player.id, item.rank]),
            [
                [2, 1],
                [3, 2],
                [1, null],
            ],
        );
        for (const previous of before) {
            const current = standing(after, previous.player.id);
            const {
                player: _previousPlayer,
                rank: _previousRank,
                participationChange: _previousParticipation,
                ...previousRecord
            } = previous;
            const {
                player: _currentPlayer,
                rank: _currentRank,
                participationChange: _currentParticipation,
                ...currentRecord
            } = current;
            assert.deepEqual(currentRecord, previousRecord);
        }
        close(standing(after, 2).opponentMatchWinPercentage, 1);
        close(standing(after, 2).opponentGameWinPercentage, 1);
        assert.equal(standing(after, 1).matchPoints, 3);
        assert.deepEqual(event, snapshot);
    });

    it("keeps ordinary drops ranked and restores rank when disqualification is corrected", () => {
        const event = tournament([round([match(1, 2, 2, 0)], [1])]);
        event.rounds.push({ ...round([]), number: 2 });
        event.rounds[1].participationChanges = [
            { playerId: 1, type: "DISQUALIFIED" },
        ];
        event.rounds[1].participationChanges.push({
            playerId: 3,
            type: "DISQUALIFIED",
        });
        // oxlint-disable-next-line unicorn/prefer-structured-clone -- Verify the saved JSON retains disqualification state.
        const persisted: unknown = JSON.parse(JSON.stringify(event));
        assert.deepEqual(persisted, event);
        const saved = structuredClone(event);
        assert.deepEqual(
            calculateStandings(saved).map((item) => [
                item.player.id,
                item.rank,
            ]),
            [
                [2, 1],
                [1, null],
                [3, null],
            ],
        );

        saved.rounds[1].participationChanges = [
            { playerId: 3, type: "DISQUALIFIED" },
        ];
        const restored = calculateStandings(saved);
        assert.deepEqual(
            restored.map((item) => [item.player.id, item.rank]),
            [
                [1, 1],
                [2, 2],
                [3, null],
            ],
        );
        assert.equal(standing(restored, 1).participationChange, "DROPPED");
        assert.deepEqual(event.rounds[1].participationChanges, [
            { playerId: 1, type: "DISQUALIFIED" },
            { playerId: 3, type: "DISQUALIFIED" },
        ]);
    });

    it("assigns no ranks when every player is disqualified", () => {
        const event = tournament([round([])]);
        event.rounds[0].participationChanges = [1, 2, 3].map((playerId) => ({
            playerId,
            type: "DISQUALIFIED",
        }));
        assert.deepEqual(
            calculateStandings(event).map((item) => item.rank),
            [null, null, null],
        );
    });
    it("removes rank immediately for a disqualification in the current round while preserving completed results", () => {
        const event = tournament([round([match(1, 2, 2, 0)])]);
        const current = round([match(1, 3, 0, 2)]);
        current.number = 2;
        current.status = "IN_PROGRESS";
        current.participationChanges = [{ playerId: 1, type: "DISQUALIFIED" }];
        event.rounds.push(current);
        const standings = calculateStandings(event);
        const disqualified = standing(standings, 1);
        assert.equal(disqualified.rank, null);
        assert.equal(disqualified.participationChange, "DISQUALIFIED");
        assert.equal(disqualified.matchPoints, 3);
        assert.equal(disqualified.matchLosses, 0);
        close(standing(standings, 2).opponentMatchWinPercentage, 1);
        assert.equal(standings.at(-1)?.player.id, 1);
    });
});
