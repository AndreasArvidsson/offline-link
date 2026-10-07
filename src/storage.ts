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
    usedIds: new Set<string>(),
};

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
        if (!_storage.usedIds.has(tournament.id)) {
            _storage.usedIds.add(tournament.id);
            _storage.tournaments.push(tournament);
        }
        await writeItemToDisk(tournament);
    },
};

async function readItemsFromDisk(): Promise<Tournament[]> {
    const files = await readdir(directoryPath);
    const items: Tournament[] = [];

    for (const file of files) {
        const filepath = path.join(directoryPath, file);
        // oxlint-disable-next-line no-await-in-loop
        const item = await readItemFromDisk(filepath);
        if (item != null) {
            items.push(item);
        }
    }

    items.sort((a, b) => b.createdAt - a.createdAt);

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
