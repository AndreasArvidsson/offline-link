import assert from "node:assert/strict";
import {
    mkdir,
    mkdtemp,
    readFile,
    readdir,
    rm,
    stat,
    writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "mocha";
import { readJsonFile, writeJsonFile } from "../util/jsonFiles.ts";

describe("JSON file persistence", () => {
    let directoryPath: string;
    let filePath: string;

    beforeEach(async () => {
        directoryPath = await mkdtemp(
            path.join(tmpdir(), "offline-link-json-test-"),
        );
        filePath = path.join(directoryPath, "tournament.json");
    });

    afterEach(async () => {
        assert.equal(path.dirname(directoryPath), path.resolve(tmpdir()));
        assert.ok(
            path.basename(directoryPath).startsWith("offline-link-json-test-"),
        );
        await rm(directoryPath, { recursive: true, force: true });
    });

    it("creates a readable JSON file without leaving temporary files", async () => {
        const data = { name: "Tournament", rounds: [] };
        await writeJsonFile(filePath, data);
        assert.deepEqual(await readJsonFile(filePath), data);
        assert.equal(
            await readFile(filePath, "utf8"),
            JSON.stringify(data, null, 2),
        );
        assert.deepEqual(await readdir(directoryPath), ["tournament.json"]);
    });

    it("replaces an existing file with the complete new snapshot", async () => {
        await writeFile(filePath, JSON.stringify({ name: "Previous" }), "utf8");
        const data = { name: "Updated", rounds: [{ number: 1 }] };
        await writeJsonFile(filePath, data);
        assert.deepEqual(await readJsonFile(filePath), data);
        assert.deepEqual(await readdir(directoryPath), ["tournament.json"]);
    });

    it("preserves the existing file when serialization fails", async () => {
        const original = JSON.stringify({ name: "Previous" });
        await writeFile(filePath, original, "utf8");
        await assert.rejects(
            writeJsonFile(filePath, { unsupported: 1n }),
            TypeError,
        );
        assert.equal(await readFile(filePath, "utf8"), original);
        assert.deepEqual(await readdir(directoryPath), ["tournament.json"]);
    });

    it("rejects a failed replacement and cleans up its temporary file", async () => {
        await mkdir(filePath);
        await assert.rejects(writeJsonFile(filePath, { name: "Updated" }));
        const fileStats = await stat(filePath);
        assert.equal(fileStats.isDirectory(), true);
        assert.deepEqual(await readdir(directoryPath), ["tournament.json"]);
    });
});
