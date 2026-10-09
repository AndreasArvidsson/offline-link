/* oxlint-disable unicorn/max-nested-calls -- Keep pairing fixtures next to their assertions. */
import assert from "node:assert/strict";
import { describe, it } from "mocha";
import type {
    MatchResult,
    Pairing,
    Round,
    Tournament,
} from "../common/models.ts";
import { calculateStandings } from "../renderer/utils/calculateStandings.ts";
import { generateNextRound } from "../renderer/utils/generateNextRound.ts";

function tournament(playerCount: number, rounds: Round[] = []): Tournament {
    return {
        version: 1,
        id: "test",
        name: "Test",
        createdAt: 0,
        updatedAt: 0,
        roundCount: 5,
        status: "IN_PROGRESS",
        rounds,
        players: Array.from({ length: playerCount }, (_, index) => ({
            id: index + 1,
            name: `Player ${index + 1}`,
        })),
    };
}

function round(pairings: Pairing[], droppedPlayerIds: number[] = []): Round {
    return {
        number: 1,
        createdAt: 0,
        status: "COMPLETED",
        pairings,
        participationChanges: droppedPlayerIds.map((playerId) => ({
            playerId,
            type: "DROPPED",
        })),
    };
}

let nextFixturePairingId = 1;

function match(
    player1Id: number,
    player2Id: number,
    result?: MatchResult,
    id: number = nextFixturePairingId++,
): Pairing {
    return {
        type: "MATCH",
        id,
        table: 1,
        player1Id,
        player2Id,
        result: result ?? { player1Wins: 2, player2Wins: 0, draws: 0 },
    };
}

function matchIds(next: Round): number[][] {
    return next.pairings.flatMap((pairing) =>
        pairing.type === "MATCH"
            ? [[pairing.player1Id, pairing.player2Id]]
            : [],
    );
}

function opponentKey(first: number, second: number): string {
    return [first, second].toSorted((a, b) => a - b).join("-");
}

function tournamentWithManyDrops(): Tournament {
    const event = tournament(130);
    event.roundCount = 8;
    const lowPlayers = Array.from({ length: 8 }, (_, index) => index + 9);
    const drawResult = { player1Wins: 1, player2Wins: 1, draws: 0 };

    for (let roundIndex = 0; roundIndex < 7; roundIndex++) {
        const pairings: Pairing[] = [];

        // Players 9-16 draw against every other member of their group.
        for (let index = 0; index < 4; index++) {
            pairings.push(
                match(lowPlayers[index], lowPlayers[7 - index], drawResult),
            );
        }

        // Players 1-8 win against distinct opponents from two 57-player groups.
        const firstOpponentIndex = roundIndex * 4;
        for (let index = 0; index < 4; index++) {
            const leftIndex = firstOpponentIndex + index;
            const rightIndex = (leftIndex + roundIndex) % 57;
            pairings.push(
                match(index + 1, 17 + leftIndex),
                match(index + 5, 74 + rightIndex),
            );
        }

        // A different rotation pairs all remaining players without rematches.
        for (let index = 0; index < 57; index++) {
            if (index >= firstOpponentIndex && index < firstOpponentIndex + 4) {
                continue;
            }
            pairings.push(
                match(17 + index, 74 + ((index + roundIndex) % 57), drawResult),
            );
        }

        event.rounds.push({
            ...round(pairings),
            number: roundIndex + 1,
            participationChanges:
                roundIndex === 6
                    ? event.players
                          .filter((player) => player.id > 16)
                          .map((player) => ({
                              playerId: player.id,
                              type: "DROPPED",
                          }))
                    : [],
        });
        lowPlayers.splice(1, 0, ...lowPlayers.splice(-1));
    }

    return event;
}

describe("generateNextRound", () => {
    it("uses standings rather than point-gap optimization for the final Swiss round", () => {
        const event = tournament(8, [
            round([
                match(7, 5, { player1Wins: 2, player2Wins: 1, draws: 0 }),
                match(3, 2),
                match(8, 6, { player1Wins: 1, player2Wins: 2, draws: 0 }),
                match(4, 1, { player1Wins: 1, player2Wins: 1, draws: 0 }),
            ]),
            {
                ...round([
                    match(3, 6, { player1Wins: 0, player2Wins: 2, draws: 0 }),
                    match(7, 1, { player1Wins: 0, player2Wins: 2, draws: 0 }),
                    match(4, 5, { player1Wins: 0, player2Wins: 2, draws: 0 }),
                    match(8, 2),
                ]),
                number: 2,
            },
        ]);
        event.roundCount = 3;

        assert.deepEqual(
            calculateStandings(event).map((standing) => standing.player.id),
            [6, 1, 8, 3, 7, 5, 4, 2],
        );
        assert.deepEqual(matchIds(generateNextRound(event)), [
            [6, 1],
            [8, 3],
            [7, 4],
            [5, 2],
        ]);
    });

    it("skips previous opponents when power pairing the final round", () => {
        const drawResult = { player1Wins: 1, player2Wins: 1, draws: 0 };
        const event = tournament(4, [
            round([match(1, 2, drawResult), match(3, 4, drawResult)]),
        ]);
        event.roundCount = 2;

        assert.deepEqual(matchIds(generateNextRound(event)), [
            [1, 3],
            [2, 4],
        ]);
    });

    it("skips a fresh higher-ranked opponent when it would strand the final-round remainder", () => {
        const drawResult = { player1Wins: 1, player2Wins: 1, draws: 0 };
        const event = tournament(6, [
            round([
                match(1, 4, drawResult),
                match(2, 3, drawResult),
                match(5, 6, drawResult),
            ]),
            {
                ...round(
                    [
                        match(3, 4, drawResult),
                        match(1, 5, drawResult),
                        match(2, 6, drawResult),
                    ],
                    [5, 6],
                ),
                number: 2,
            },
        ]);
        event.roundCount = 3;

        // 1-2 is fresh, but would leave a rematch between 3 and 4.
        assert.deepEqual(matchIds(generateNextRound(event)), [
            [1, 3],
            [2, 4],
        ]);
    });

    it("preserves rank preference when repairing and replacing the final-round matching", () => {
        const drawResult = { player1Wins: 1, player2Wins: 1, draws: 0 };
        const history = [
            [
                [2, 8],
                [4, 3],
                [6, 7],
                [5, 1],
            ],
            [
                [8, 1],
                [7, 5],
                [3, 6],
                [4, 2],
            ],
            [
                [4, 6],
                [5, 8],
                [1, 7],
                [3, 2],
            ],
            [
                [1, 2],
                [8, 3],
                [5, 6],
                [4, 7],
            ],
        ];
        const event = tournament(
            8,
            history.map((matches, index) => {
                const previousRound = round(
                    matches.map(([first, second]) =>
                        match(first, second, drawResult),
                    ),
                );
                previousRound.number = index + 1;
                return previousRound;
            }),
        );
        const before = structuredClone(event);

        // 1-3 needs a new matching; after that, 2-5 strands the remainder.
        // Choosing 2-6 instead repairs the matching by joining former partners 7-8.
        assert.deepEqual(matchIds(generateNextRound(event)), [
            [1, 3],
            [2, 6],
            [4, 5],
            [7, 8],
        ]);
        assert.deepEqual(event, before);
    });

    it("pairs by points, avoids previous opponents, and leaves the input unchanged", () => {
        const event = tournament(4, [
            round([match(1, 2, undefined, 1), match(3, 4, undefined, 2)]),
        ]);
        const before = structuredClone(event);
        const next = generateNextRound(event);
        assert.deepEqual(matchIds(next), [
            [1, 3],
            [2, 4],
        ]);
        assert.deepEqual(
            next.pairings.map((pairing) => pairing.id),
            [3, 4],
        );
        assert.equal(next.number, 2);
        assert.equal(next.status, "IN_PROGRESS");
        assert.deepEqual(next.participationChanges, []);
        assert.deepEqual(event, before);
        assert.equal(
            new Set(next.pairings.map((pairing) => pairing.id)).size,
            2,
        );
        assert.deepEqual(
            next.pairings.map((pairing) =>
                pairing.type === "MATCH" ? pairing.table : undefined,
            ),
            [1, 2],
        );
        assert.ok(
            next.pairings.every(
                (pairing) => pairing.type === "BYE" || pairing.result == null,
            ),
        );
    });

    it("continues after the highest earlier pairing ID, including byes and gaps", () => {
        const event = tournament(3, [
            round([
                match(1, 2, undefined, 4),
                { type: "BYE", id: 20, playerId: 3 },
            ]),
            {
                ...round([
                    match(1, 3, undefined, 7),
                    { type: "BYE", id: 9, playerId: 2 },
                ]),
                number: 2,
            },
        ]);
        const before = structuredClone(event);

        const next = generateNextRound(event);

        assert.deepEqual(
            next.pairings.map((pairing) => pairing.id),
            [21, 22],
        );
        assert.equal(next.pairings.at(-1)?.type, "BYE");
        assert.deepEqual(event, before);
    });

    it("starts pairing IDs at one when there is no round history", () => {
        const next = generateNextRound(tournament(3));

        assert.deepEqual(
            next.pairings.map((pairing) => pairing.id),
            [1, 2],
        );
        assert.equal(next.pairings.at(-1)?.type, "BYE");
    });

    it("backtracks when the first choice would force a rematch", () => {
        // Fresh edges are 1-2, 1-3, and 2-4; choosing 1-2 strands 3 and 4.
        const history = [match(1, 4), match(2, 3), match(3, 4)];
        for (const pairing of history) {
            if (pairing.type === "MATCH") {
                delete pairing.result;
            }
        }
        const next = generateNextRound(tournament(4, [round(history)]));
        assert.deepEqual(matchIds(next), [
            [1, 3],
            [2, 4],
        ]);
    });

    it("improves a feasible pairing to reduce the total point difference", () => {
        const drawResult = { player1Wins: 1, player2Wins: 1, draws: 0 };
        const event = tournament(6, [
            round([match(1, 2, drawResult), match(3, 4), match(6, 5)]),
            {
                ...round([match(3, 1), match(2, 6), match(5, 4)]),
                number: 2,
            },
        ]);
        const points = [0, 1, 4, 6, 0, 3, 3];
        const differences = matchIds(generateNextRound(event)).map(
            ([first, second]) => Math.abs(points[first] - points[second]),
        );

        // A feasible pairing can have differences 2, 3, 2. The same maximum
        // difference permits a better pairing with differences 3, 1, 1.
        assert.equal(Math.max(...differences), 3);
        assert.equal(
            differences.reduce((total, difference) => total + difference, 0),
            5,
        );
    });

    it("excludes dropped players and awards the lowest-ranked eligible player a bye", () => {
        const event = tournament(4, [
            round(
                [
                    match(1, 2),
                    { type: "BYE", id: nextFixturePairingId++, playerId: 3 },
                ],
                [4],
            ),
        ]);
        const next = generateNextRound(event);
        assert.deepEqual(matchIds(next), [[1, 3]]);
        assert.equal(next.pairings.at(-1)?.type, "BYE");
        const bye = next.pairings.find((pairing) => pairing.type === "BYE");
        assert.equal(bye?.playerId, 2);
    });

    it("rejects an exhausted opponent history instead of creating rematches", () => {
        assert.throws(
            () =>
                generateNextRound(
                    tournament(3, [
                        round([
                            {
                                type: "BYE",
                                id: nextFixturePairingId++,
                                playerId: 3,
                            },
                            match(1, 2),
                        ]),
                        round([match(1, 3)]),
                        round([match(2, 3)]),
                    ]),
                ),
            /without rematches/u,
        );
    });

    it("tries another bye recipient to avoid a rematch", () => {
        const prior = match(1, 2);
        if (prior.type === "MATCH") {
            delete prior.result;
        }
        const next = generateNextRound(tournament(3, [round([prior])]));
        assert.equal(
            next.pairings.find((pairing) => pairing.type === "BYE")?.playerId,
            2,
        );
        assert.deepEqual(matchIds(next), [[1, 3]]);
    });

    it("rejects a rematch when no fresh pairing exists", () => {
        assert.throws(
            () => generateNextRound(tournament(2, [round([match(1, 2)])])),
            /without rematches/u,
        );
    });

    it("preserves a valid pairing when score optimization exhausts the search budget", () => {
        const event = tournament(26, [
            round(
                Array.from({ length: 13 }, (_, index) =>
                    match(index + 1, index + 14),
                ),
            ),
        ]);
        const next = generateNextRound(event);
        const matches = matchIds(next);
        assert.equal(matches.length, 13);
        assert.equal(new Set(matches.flat()).size, 26);
        assert.ok(
            matches.every(([first, second]) => Math.abs(first - second) !== 13),
        );
    });

    it("finds a valid pairing after many drops despite the score optimization budget", () => {
        const event = tournamentWithManyDrops();
        const previousOpponents = new Set<string>();
        for (const previousRound of event.rounds) {
            const matches = matchIds(previousRound);
            assert.equal(matches.length, 65);
            assert.deepEqual(
                matches.flat().toSorted((a, b) => a - b),
                event.players.map((player) => player.id),
            );
            for (const [first, second] of matches) {
                const key = opponentKey(first, second);
                assert.ok(!previousOpponents.has(key));
                previousOpponents.add(key);
            }
        }

        const matches = matchIds(generateNextRound(event));
        assert.equal(matches.length, 8);
        assert.deepEqual(
            matches.flat().toSorted((a, b) => a - b),
            Array.from({ length: 16 }, (_, index) => index + 1),
        );
        assert.ok(
            matches.every(
                ([first, second]) =>
                    !previousOpponents.has(opponentKey(first, second)),
            ),
        );
    });

    it("uses a repeat bye when lower-count candidates would force rematches", () => {
        // Player 5 has played everyone, so only a repeat bye for 5 would permit fresh matches.
        const event = tournament(5, [
            round([
                { type: "BYE", id: nextFixturePairingId++, playerId: 5 },
                match(5, 1),
                match(5, 2),
                match(5, 3),
                match(5, 4),
            ]),
        ]);
        const next = generateNextRound(event);
        assert.equal(
            next.pairings.find((pairing) => pairing.type === "BYE")?.playerId,
            5,
        );
        assert.deepEqual(
            matchIds(next)
                .flat()
                .toSorted((a, b) => a - b),
            [1, 2, 3, 4],
        );
    });

    it("prefers fewer byes over lower standing in ordinary and final rounds", () => {
        for (const roundCount of [3, 5]) {
            const event = tournament(5, [
                round([
                    { type: "BYE", id: nextFixturePairingId++, playerId: 1 },
                    { type: "BYE", id: nextFixturePairingId++, playerId: 2 },
                    { type: "BYE", id: nextFixturePairingId++, playerId: 3 },
                ]),
                round(
                    [
                        match(1, 4),
                        match(2, 5),
                        {
                            type: "BYE",
                            id: nextFixturePairingId++,
                            playerId: 3,
                        },
                    ],
                    [4, 5],
                ),
            ]);
            event.roundCount = roundCount;
            const active = calculateStandings(event).filter(
                (player) => player.participationChange == null,
            );
            assert.deepEqual(
                active.map((player) => [player.player.id, player.byeCount]),
                [
                    [1, 1],
                    [2, 1],
                    [3, 2],
                ],
            );

            const next = generateNextRound(event);
            assert.equal(
                next.pairings.find((pairing) => pairing.type === "BYE")
                    ?.playerId,
                2,
            );
            assert.deepEqual(matchIds(next), [[1, 3]]);
        }
    });

    it("allows a repeat bye after every active player has received one", () => {
        const next = generateNextRound(
            tournament(3, [
                round([
                    { type: "BYE", id: nextFixturePairingId++, playerId: 1 },
                    { type: "BYE", id: nextFixturePairingId++, playerId: 2 },
                    { type: "BYE", id: nextFixturePairingId++, playerId: 3 },
                ]),
            ]),
        );
        assert.equal(
            next.pairings.find((pairing) => pairing.type === "BYE")?.playerId,
            3,
        );
        assert.deepEqual(matchIds(next), [[1, 2]]);
    });

    it("handles empty and single-player fields", () => {
        assert.deepEqual(generateNextRound(tournament(0)).pairings, []);
        const next = generateNextRound(tournament(1));
        assert.equal(next.pairings.length, 1);
        assert.equal(next.pairings[0].type, "BYE");
    });

    it("rejects generating pairings before the previous round is completed", () => {
        const pending = round([match(1, 2)]);
        pending.status = "IN_PROGRESS";
        assert.throws(
            () => generateNextRound(tournament(2, [pending])),
            /Complete the current round/u,
        );
    });
    it("excludes disqualified players from matches and byes in ordinary and final rounds", () => {
        for (const roundCount of [2, 5]) {
            for (const playerId of [1, 4]) {
                const event = tournament(4, [
                    round([match(1, 2), match(3, 4)]),
                ]);
                event.roundCount = roundCount;
                event.rounds[0].participationChanges = [
                    { playerId, type: "DISQUALIFIED" },
                ];
                const before = structuredClone(event);
                const next = generateNextRound(event);
                const participants = next.pairings.flatMap((pairing) =>
                    pairing.type === "MATCH"
                        ? [pairing.player1Id, pairing.player2Id]
                        : [pairing.playerId],
                );
                assert.deepEqual(
                    participants.toSorted((a, b) => a - b),
                    event.players
                        .filter((player) => player.id !== playerId)
                        .map((player) => player.id),
                );
                assert.equal(
                    next.pairings.filter((pairing) => pairing.type === "BYE")
                        .length,
                    1,
                );
                assert.deepEqual(event, before);
            }
        }
    });

    it("allows corrected disqualifications to pair again while preserving separate drops", () => {
        const event = tournament(4, [round([match(1, 2), match(3, 4)])]);
        event.rounds[0].participationChanges = [
            { playerId: 1, type: "DISQUALIFIED" },
        ];
        event.rounds[0].participationChanges = [];
        assert.deepEqual(matchIds(generateNextRound(event)), [
            [1, 3],
            [2, 4],
        ]);
        event.rounds[0].participationChanges = [
            { playerId: 1, type: "DROPPED" },
        ];
        assert.ok(!matchIds(generateNextRound(event)).flat().includes(1));
        assert.ok(
            !generateNextRound(event).pairings.some(
                (pairing) => pairing.type === "BYE" && pairing.playerId === 1,
            ),
        );
    });

    it("generates no pairings when every player is disqualified", () => {
        const event = tournament(2, [round([match(1, 2)])]);
        event.rounds[0].participationChanges = [1, 2].map((playerId) => ({
            playerId,
            type: "DISQUALIFIED",
        }));
        assert.deepEqual(generateNextRound(event).pairings, []);
    });
});
