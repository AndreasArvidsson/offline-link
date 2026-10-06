import { readFile } from "node:fs/promises";

export async function readJsonFile<T>(filePath: string): Promise<T> {
    const data = await readFile(filePath, "utf8");
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return JSON.parse(data) as T;
}
