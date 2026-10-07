export function formatRecord(
    wins: number,
    losses: number,
    draws: number,
): string {
    if (draws > 0) {
        const suffix = draws === 1 ? "draw" : "draws";
        return `${wins} - ${losses} (${draws} ${suffix})`;
    }
    return `${wins} - ${losses}`;
}
