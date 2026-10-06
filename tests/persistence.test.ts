import assert from "node:assert/strict";
import {
    mkdtemp,
    mkdir,
    readFile,
    readdir,
    rm,
    writeFile,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { atomicWrite } from "../src/persistence/atomic.ts";
import { TournamentStore } from "../src/persistence/store.ts";

// Keep test data inside the workspace; cleanup is limited to this known root.
async function setup(t: { after: (fn: () => Promise<void>) => void }) {
    const root = await mkdtemp(join(process.cwd(), ".test-offlinelink-"));
    t.after(async () => {
        const target = resolve(root);
        assert.ok(
            target.startsWith(
                `${resolve(process.cwd())}${process.platform === "win32" ? "\\" : "/"}.test-offlinelink-`,
            ),
        );
        await rm(target, {
            recursive: true,
            force: true,
            maxRetries: 5,
            retryDelay: 100,
        });
    });
    const directory = join(root, "tournaments");
    await mkdir(directory);
    const settings = join(root, "app-data", "settings.json");
    const store = new TournamentStore(settings);
    await store.chooseDirectory(directory);
    return { root, directory, settings, store };
}

test("creating immediately persists a portable human-readable tournament", async (t) => {
    const { store } = await setup(t);
    const event = await store.create("FNM", ["Alice", "Bob"]);
    const contents = await readFile(event.filePath, "utf8");
    assert.ok(contents.includes('\n  "version": 1,'));
    assert.deepEqual(JSON.parse(contents), event.tournament);
    assert.match(event.filePath, /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
});

test("same-name events never overwrite one another and rename keeps the path", async (t) => {
    const { store } = await setup(t);
    const first = await store.create("FNM", ["Alice"]);
    const second = await store.create("FNM", ["Bob"]);
    assert.notEqual(first.filePath, second.filePath);
    assert.notEqual(first.tournament.id, second.tournament.id);
    const updated = await store.change(first.sessionId, {
        type: "RENAME",
        name: "Renamed",
    });
    assert.equal(updated.filePath, first.filePath);
    assert.equal(updated.tournament.id, first.tournament.id);
    assert.equal(
        JSON.parse(await readFile(second.filePath, "utf8")).name,
        "FNM",
    );
});

test("restart remembers the directory and reopening reproduces exact state", async (t) => {
    const { store, settings, directory } = await setup(t);
    let event = await store.create("FNM", ["Alice"]);
    event = await store.change(event.sessionId, {
        type: "ADD_PLAYER",
        name: "Bob",
    });
    event = await store.change(event.sessionId, {
        type: "SET_PLAYER_STATUS",
        playerId: event.tournament.players[0]!.id,
        status: "DROPPED",
    });
    const restarted = new TournamentStore(settings);
    const home = await restarted.home();
    assert.equal(home.directory, directory);
    assert.equal(home.recent.length, 1);
    assert.deepEqual(
        (await restarted.openRecent(event.filePath)).tournament,
        event.tournament,
    );
});

test("historical facts round-trip unchanged during metadata correction", async (t) => {
    const { directory, store } = await setup(t);
    const contents = await readFile(
        new URL("./fixtures/history.json", import.meta.url),
        "utf8",
    );
    const path = join(directory, "history.json");
    await writeFile(path, contents);
    const event = await store.open(path);
    const changed = await store.change(event.sessionId, {
        type: "RENAME",
        name: "Corrected",
    });
    assert.deepEqual(changed.tournament.rounds, event.tournament.rounds);
    assert.deepEqual((await store.open(path)).tournament, changed.tournament);
});

test("external edits block autosave and reload requires explicit review", async (t) => {
    const { store } = await setup(t);
    const event = await store.create("FNM", ["Alice"]);
    const external = { ...event.tournament, name: "Externally edited" };
    const contents = JSON.stringify(external);
    await writeFile(event.filePath, contents);
    await assert.rejects(
        store.change(event.sessionId, { type: "RENAME", name: "Local edit" }),
        /changed outside OfflineLink/,
    );
    assert.equal(await readFile(event.filePath, "utf8"), contents);
    const reloaded = await store.reload(event.sessionId);
    assert.equal(reloaded.tournament.name, "Externally edited");
    const changed = await store.change(event.sessionId, {
        type: "RENAME",
        name: "Reviewed",
    });
    assert.equal(changed.tournament.name, "Reviewed");
});

test("corrupt external changes never get overwritten", async (t) => {
    const { store } = await setup(t);
    const event = await store.create("FNM", ["Alice"]);
    await writeFile(event.filePath, "{broken");
    await assert.rejects(
        store.change(event.sessionId, { type: "RENAME", name: "Local" }),
        /Cannot safely save/,
    );
    await assert.rejects(store.reload(event.sessionId), /Invalid JSON/);
    assert.equal(await readFile(event.filePath, "utf8"), "{broken");
});

test("directory scan reports invalid and newer files without modifying them", async (t) => {
    const { store, directory } = await setup(t);
    const event = await store.create("Good", ["Alice"]);
    const newer = JSON.stringify({ ...event.tournament, version: 2 });
    await writeFile(join(directory, "newer.json"), newer);
    await writeFile(join(directory, "broken.json"), "{broken");
    await writeFile(
        join(directory, ".offlinelink-interrupted.tmp"),
        "{partial",
    );
    const home = await store.home();
    assert.equal(home.recent.length, 1);
    assert.equal(home.issues.length, 2);
    await assert.rejects(
        store.open(join(directory, "newer.json")),
        /unsupported schema/,
    );
    assert.equal(await readFile(join(directory, "newer.json"), "utf8"), newer);
    assert.equal(
        await readFile(join(directory, "broken.json"), "utf8"),
        "{broken",
    );
});

test("native-picker backend can open outside the configured folder; recent API cannot", async (t) => {
    const { store, root } = await setup(t);
    const event = await store.create("FNM", ["Alice"]);
    const outside = join(root, "outside.json");
    await writeFile(outside, await readFile(event.filePath));
    await assert.rejects(store.openRecent(outside), /native file picker/);
    assert.deepEqual((await store.open(outside)).tournament, event.tournament);
});

test("recent tournaments sort by parsed updatedAt, regardless of timezone offset", async (t) => {
    const { store } = await setup(t);
    const first = await store.create("Earlier", ["Alice"]);
    const second = await store.create("Later", ["Bob"]);
    await writeFile(
        first.filePath,
        JSON.stringify({
            ...first.tournament,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-02T18:00:00+02:00",
        }),
    );
    await writeFile(
        second.filePath,
        JSON.stringify({
            ...second.tournament,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-02T17:00:00Z",
        }),
    );
    assert.deepEqual(
        (await store.home()).recent.map((r) => r.name),
        ["Later", "Earlier"],
    );
});

test("failed atomic replacement keeps the previous file and removes temporary data", async (t) => {
    const { root } = await setup(t);
    const path = join(root, "file.json");
    await writeFile(path, "original");
    await assert.rejects(
        atomicWrite(path, "replacement", {
            beforeCommit: async () => {
                throw new Error("Simulated failed save");
            },
        }),
        /Simulated/,
    );
    assert.equal(await readFile(path, "utf8"), "original");
    assert.ok(!(await readdir(root)).some((name) => name.endsWith(".tmp")));
});

test("exclusive atomic publication cannot overwrite an existing file", async (t) => {
    const { root } = await setup(t);
    const path = join(root, "file.json");
    await atomicWrite(path, "original", { createOnly: true });
    await assert.rejects(atomicWrite(path, "new", { createOnly: true }), {
        code: "EEXIST",
    });
    assert.equal(await readFile(path, "utf8"), "original");
});

test("queued mutations preserve every acknowledged operation after an error", async (t) => {
    const { store } = await setup(t);
    const event = await store.create("FNM", ["Alice"]);
    const outcomes = await Promise.allSettled([
        store.exclusive(() =>
            store.change(event.sessionId, { type: "ADD_PLAYER", name: "Bob" }),
        ),
        store.exclusive(() =>
            store.change(event.sessionId, { type: "ADD_PLAYER", name: "" }),
        ),
        store.exclusive(() =>
            store.change(event.sessionId, {
                type: "ADD_PLAYER",
                name: "Charlie",
            }),
        ),
    ]);
    assert.deepEqual(
        outcomes.map((r) => r.status),
        ["fulfilled", "rejected", "fulfilled"],
    );
    assert.deepEqual(
        (await store.open(event.filePath)).tournament.players.map(
            (p) => p.name,
        ),
        ["Alice", "Bob", "Charlie"],
    );
});

test("unsupported settings are reported and preserved", async (t) => {
    const { settings, directory } = await setup(t);
    const original = JSON.stringify({
        version: 2,
        tournamentDirectory: directory,
        future: true,
    });
    await writeFile(settings, original);
    const store = new TournamentStore(settings);
    await assert.rejects(store.home(), /Original settings were preserved/);
    await assert.rejects(
        store.chooseDirectory(directory),
        /Original settings were preserved/,
    );
    assert.equal(await readFile(settings, "utf8"), original);
});
