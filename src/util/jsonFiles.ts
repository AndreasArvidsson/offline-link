import { randomUUID } from "node:crypto";
import { readFile, rename, rm, writeFile } from "node:fs/promises";

export async function readJsonFile<T>(filePath: string): Promise<T> {
    const data = await readFile(filePath, "utf8");
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return JSON.parse(data) as T;
}

export async function writeJsonFile(
    filePath: string,
    data: unknown,
): Promise<void> {
    const json = JSON.stringify(data, null, 2);
    const temporaryPath = `${filePath}.${randomUUID()}.tmp`;

    try {
        await writeFile(temporaryPath, json, {
            encoding: "utf8",
            flag: "wx",
            flush: true,
        });
        await rename(temporaryPath, filePath);
    } catch (error) {
        await rm(temporaryPath, { force: true });
        throw error;
    }
}
