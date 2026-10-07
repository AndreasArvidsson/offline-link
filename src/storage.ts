import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { app } from "electron";
import { APP_NAME } from "./common/constants.ts";
import type { Tournament } from "./common/models.ts";
import { readJsonFile, writeJsonFile } from "./util/jsonFiles.ts";
import { showErrorNotification } from "./util/notifications.ts";

const directoryPath = path.join(app.getPath("documents"), APP_NAME);

interface Storage {
    tournaments: Tournament[];
    usedIds: Set<string>;
}

let _storage: Storage = {
    tournaments: [],
    usedIds: new Set(),
};

let writeQueue: Promise<void> = Promise.resolve();

export const storage = {
    async init(): Promise<void> {
        await mkdir(directoryPath, { recursive: true });
        const tournaments = await readItemsFromDisk();
        _storage = {
            tournaments,
            usedIds: new Set(tournaments.map((t) => t.id)),
        };
    },

    getTournaments(): Tournament[] {
        return _storage.tournaments;
    },

    async saveTournament(tournament: Tournament): Promise<void> {
        const previousSave = writeQueue;
        // oxlint-disable-next-line typescript/no-invalid-void-type
        const { promise, resolve } = Promise.withResolvers<void>();
        writeQueue = promise;

        try {
            await previousSave;
            await writeItemToDisk(tournament);

            if (_storage.usedIds.has(tournament.id)) {
                // Tournament is already at the start of the list, just update it.
                if (_storage.tournaments[0].id === tournament.id) {
                    Object.assign(_storage.tournaments[0], tournament);
                }
                // Tournament already exists, but it's not at the start of the list.
                else {
                    const index = _storage.tournaments.findIndex(
                        (t) => t.id === tournament.id,
                    );
                    _storage.tournaments.splice(index, 1);
                    _storage.tournaments.unshift(tournament);
                }
            }
            // Tournament does not exist yet, add it to the start of the list.
            else {
                _storage.usedIds.add(tournament.id);
                _storage.tournaments.unshift(tournament);
            }
        } finally {
            resolve();
        }
    },
};

async function readItemsFromDisk(): Promise<Tournament[]> {
    const files = await readdir(directoryPath);
    const items: Tournament[] = [];

    for (const file of files) {
        if (!file.endsWith(".json")) {
            continue;
        }
        const filepath = path.join(directoryPath, file);
        // oxlint-disable-next-line no-await-in-loop
        const item = await readItemFromDisk(filepath);
        if (item != null) {
            items.push(item);
        }
    }

    // Sort tournaments by update date in descending order
    items.sort((a, b) => b.updatedAt - a.updatedAt);

    return items;
}

async function readItemFromDisk(
    filepath: string,
): Promise<Tournament | undefined> {
    try {
        return await readJsonFile<Tournament>(filepath);
    } catch (error) {
        showErrorNotification(
            `Failed to parse tournament file: ${filepath}`,
            error,
        );
        return undefined;
    }
}

async function writeItemToDisk(tournament: Tournament): Promise<void> {
    const filepath = path.join(directoryPath, `${tournament.id}.json`);
    await writeJsonFile(filepath, tournament);
}
