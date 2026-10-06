import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { commandRequest, creationRequest } from "../src/main/ipc-validation.ts";
import type { Tournament } from "../src/tournament/models.ts";
import { tournamentFilename } from "../src/tournament/time.ts";
import {
    applyCommand,
    createTournament,
} from "../src/tournament/tournament.ts";
import {
    parseTournament,
    validateTournament,
} from "../src/tournament/validation.ts";

const fixture = async (): Promise<Tournament> =>
    parseTournament(
        await readFile(
            new URL("./fixtures/history.json", import.meta.url),
            "utf8",
        ),
    );
const date = new Date("2026-01-01T12:00:00Z");
function fresh(): Tournament {
    let counter = 0;
    return createTournament(
        "Friday Night Magic",
        ["Anna", "Anna"],
        () => `id-${counter++}`,
        date,
    );
}

test("creation uses independent stable IDs and preserves duplicate player names", () => {
    const tournament = fresh();
    assert.equal(tournament.version, 1);
    assert.equal(tournament.players[0]?.name, tournament.players[1]?.name);
    assert.notEqual(tournament.players[0]?.id, tournament.players[1]?.id);
    assert.deepEqual(parseTournament(JSON.stringify(tournament)), tournament);
});

test("stored timestamps use UTC ISO strings with milliseconds", () => {
    const now = new Date("2026-10-06T13:27:31.123+02:00");
    let counter = 0;
    const tournament = createTournament(
        "Test",
        ["Anna"],
        () => `id-${counter++}`,
        now,
    );
    assert.equal(tournament.createdAt, "2026-10-06T11:27:31.123Z");
    assert.equal(tournament.updatedAt, tournament.createdAt);
    const updated = applyCommand(
        tournament,
        { type: "RENAME", name: "Renamed" },
        () => "unused",
        new Date("2026-10-06T13:28:31.456+02:00"),
    );
    assert.equal(updated.createdAt, tournament.createdAt);
    assert.equal(updated.updatedAt, "2026-10-06T11:28:31.456Z");
});

test("filenames use local time and are Windows-safe", () => {
    const date = new Date(2026, 9, 6, 13, 27, 31);
    assert.equal(tournamentFilename(date), "2026-10-06T13-27-31.json");
});

test("rename and player commands never change historical pairings", async () => {
    const original = await fixture();
    const renamed = applyCommand(
        original,
        { type: "RENAME", name: "New name" },
        () => "unused",
    );
    assert.equal(renamed.id, original.id);
    assert.deepEqual(renamed.rounds, original.rounds);
    assert.equal(original.name, "Recorded history fixture");
    const reactivated = applyCommand(
        renamed,
        { type: "SET_PLAYER_STATUS", playerId: "bob", status: "ACTIVE" },
        () => "unused",
    );
    assert.equal(reactivated.players[1]?.droppedAfterRound, undefined);
    assert.deepEqual(reactivated.rounds, original.rounds);
});

test("dropping retains the player and historical facts", async () => {
    const original = await fixture();
    const dropped = applyCommand(
        original,
        { type: "SET_PLAYER_STATUS", playerId: "alice", status: "DROPPED" },
        () => "unused",
    );
    assert.equal(dropped.players.length, 3);
    assert.equal(dropped.players[0]?.droppedAfterRound, 2);
    assert.deepEqual(dropped.rounds, original.rounds);
});

test("completed tournaments require reopening before editing", () => {
    const completed = applyCommand(
        fresh(),
        { type: "SET_EVENT_STATUS", status: "COMPLETED" },
        () => "unused",
    );
    assert.throws(
        () =>
            applyCommand(
                completed,
                { type: "ADD_PLAYER", name: "Bob" },
                () => "bob",
            ),
        /Reopen/,
    );
    const reopened = applyCommand(
        completed,
        { type: "SET_EVENT_STATUS", status: "IN_PROGRESS" },
        () => "unused",
    );
    assert.equal(
        applyCommand(reopened, { type: "ADD_PLAYER", name: "Bob" }, () => "bob")
            .players.length,
        3,
    );
});

test("cannot complete an event with unfinished rounds", async () => {
    const awaitValue = await fixture();
    assert.throws(
        () =>
            applyCommand(
                awaitValue,
                { type: "SET_EVENT_STATUS", status: "COMPLETED" },
                () => "unused",
            ),
        /Finish all rounds/,
    );
});

test("rejects corrupt JSON, unsupported versions, and unknown fields without coercion", () => {
    assert.throws(() => parseTournament("{"), /Invalid JSON/);
    assert.throws(
        () => validateTournament({ ...fresh(), version: 2 }),
        /unsupported schema version/,
    );
    assert.throws(
        () => validateTournament({ ...fresh(), secretFutureData: true }),
        /unknown field/,
    );
    assert.throws(
        () => validateTournament({ ...fresh(), name: 12 }),
        /non-empty text/,
    );
    assert.throws(
        () =>
            validateTournament({
                ...fresh(),
                createdAt: "2026-02-31T12:00:00Z",
                updatedAt: "2026-03-31T12:00:00Z",
            }),
        /invalid calendar/,
    );
});

test("rejects duplicate stable IDs and invalid drop markers", () => {
    const value = fresh();
    value.players[1]!.id = value.players[0]!.id;
    assert.throws(() => validateTournament(value), /duplicate stable ID/);
    const dropped = fresh();
    dropped.players[0]!.status = "DROPPED";
    assert.throws(() => validateTournament(dropped), /integer/);
    dropped.players[0]!.droppedAfterRound = 10;
    assert.throws(() => validateTournament(dropped), /future round/);
});

test("rejects self-pairing, duplicate appearances, unknown players, and duplicate tables", async () => {
    const original = await fixture();
    const self = structuredClone(original);
    const match = self.rounds[0]!.pairings[0]!;
    assert.equal(match.type, "MATCH");
    if (match.type === "MATCH") {
        match.player2Id = match.player1Id;
    }
    assert.throws(() => validateTournament(self), /more than once/);
    const unknown = structuredClone(original);
    unknown.rounds[0]!.activePlayerIds.push("unknown");
    assert.throws(() => validateTournament(unknown), /unknown or duplicate/);
    const duplicate = fresh();
    duplicate.players.push(
        { id: "p3", name: "Three", status: "ACTIVE" },
        { id: "p4", name: "Four", status: "ACTIVE" },
    );
    duplicate.rounds.push({
        number: 1,
        createdAt: duplicate.createdAt,
        source: "MANUAL",
        status: "IN_PROGRESS",
        activePlayerIds: duplicate.players.map((p) => p.id),
        pairings: [
            {
                type: "MATCH",
                id: "m1",
                table: 1,
                player1Id: "id-1",
                player2Id: "id-2",
            },
            {
                type: "MATCH",
                id: "m2",
                table: 1,
                player1Id: "p3",
                player2Id: "p4",
            },
        ],
    });
    assert.throws(() => validateTournament(duplicate), /duplicate table/);
});

test("unreported is distinct from a recorded zero-zero result", async () => {
    const original = await fixture();
    const pairing = original.rounds[1]!.pairings[0]!;
    if (pairing.type !== "MATCH") {
        throw new Error("Invalid fixture");
    }
    assert.equal(pairing.result, undefined);
    pairing.result = { player1Wins: 0, player2Wins: 0, draws: 0 };
    assert.deepEqual(validateTournament(original), original);
    pairing.result.draws = -1;
    assert.throws(() => validateTournament(original), /integer/);
});

test("completed rounds must account for all players and have reported matches", async () => {
    const original = await fixture();
    assert.throws(
        () => validateTournament({ ...original, status: "COMPLETED" }),
        /unfinished rounds/,
    );
    original.rounds[1]!.status = "COMPLETED";
    assert.throws(() => validateTournament(original), /unreported/);
    original.rounds[1]!.pairings = [];
    assert.throws(() => validateTournament(original), /unpaired/);
});

test("IPC requests reject malformed and extra payload fields", () => {
    assert.throws(
        () => creationRequest({ name: "FNM", players: [42] }),
        /non-empty text/,
    );
    assert.throws(
        () =>
            commandRequest({
                type: "RENAME",
                name: "FNM",
                filePath: "secret.json",
            }),
        /Unknown/,
    );
    assert.throws(
        () =>
            commandRequest({
                type: "SET_PLAYER_STATUS",
                playerId: "one",
                status: "DELETED",
            }),
        /Invalid/,
    );
    assert.throws(
        () => commandRequest({ type: "RENAME", name: "FNM", playerId: "one" }),
        /Unknown/,
    );
    assert.throws(() => commandRequest(null), /Invalid/);
});
