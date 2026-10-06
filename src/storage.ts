import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { app } from "electron";
import { APP_NAME } from "./common/constants.ts";
import type { Tournament } from "./common/models.ts";
import { showErrorNotification } from "./util/notifications.ts";
import { readJsonFile } from "./util/readJsonFile.ts";

const directoryPath = path.join(app.getPath("documents"), APP_NAME);
let _tournaments: Tournament[] = [];

const testTournament: Tournament = {
    version: 1,
    id: "test",
    name: "Test Tournament",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    roundCount: 0,
    status: "IN_PROGRESS",
    players: [
        {
            id: 1,
            name: "Player A",
        },
        {
            id: 2,
            name: "Player B",
        },
        {
            id: 3,
            name: "Player C",
        },
    ],
    rounds: [],
};

export const storage = {
    async init(): Promise<void> {
        await mkdir(directoryPath, { recursive: true });
        _tournaments = await readItemsFromDisk();
    },

    getTournaments(): Tournament[] {
        // TODO: Replace with actual storage retrieval
        // return _tournaments;
        return [testTournament];
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
