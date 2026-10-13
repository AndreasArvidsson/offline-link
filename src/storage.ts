import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { app } from "electron";
import { APP_NAME } from "./common/constants.ts";
import type { Tournament } from "./common/models.ts";
import { readJsonFile, writeJsonFile } from "./util/jsonFiles.ts";
import { showErrorNotification } from "./util/notifications.ts";

const directoryPath = path.join(app.getPath("documents"), APP_NAME);

let tournaments: Tournament[] = [];

let writeQueue: Promise<void> = Promise.resolve();

export const storage = {
    async init(): Promise<void> {
        await mkdir(directoryPath, { recursive: true });
        tournaments = await readItemsFromDisk();
    },

    getTournaments(): Tournament[] {
        return tournaments;
    },

    async saveTournament(tournament: Tournament): Promise<void> {
        const previousSave = writeQueue;
        // oxlint-disable-next-line typescript/no-invalid-void-type
        const { promise, resolve } = Promise.withResolvers<void>();
        writeQueue = promise;

        try {
            await previousSave;
            await writeItemToDisk(tournament);

            const index = tournaments.findIndex((t) => t.id === tournament.id);

            if (index === -1) {
                tournaments.push(tournament);
            } else {
                tournaments[index] = tournament;
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
