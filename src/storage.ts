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
    roundCount: 3,
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
    rounds: [
        {
            number: 1,
            createdAt: Date.now(),
            status: "COMPLETED",
            droppedPlayerIds: [1],
            pairings: [
                {
                    type: "MATCH",
                    id: "match1",
                    table: 1,
                    player1Id: 1,
                    player2Id: 2,
                    result: { player1Wins: 1, player2Wins: 1, draws: 1 },
                },
                {
                    type: "BYE",
                    id: "match2",
                    playerId: 3,
                },
            ],
        },
        {
            number: 2,
            createdAt: Date.now(),
            status: "COMPLETED",
            droppedPlayerIds: [],
            pairings: [
                {
                    type: "MATCH",
                    id: "match1",
                    table: 1,
                    player1Id: 2,
                    player2Id: 3,
                    result: { player1Wins: 2, player2Wins: 0, draws: 0 },
                },
            ],
        },
        {
            number: 3,
            createdAt: Date.now(),
            status: "IN_PROGRESS",
            droppedPlayerIds: [],
            pairings: [
                {
                    type: "MATCH",
                    id: "match1",
                    table: 1,
                    player1Id: 2,
                    player2Id: 3,
                },
            ],
        },
    ],
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
