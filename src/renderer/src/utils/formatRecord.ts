export function formatRecord(
    wins: number,
    losses: number,
    draws: number,
): string {
    if (draws > 0) {
        return `${wins} - ${losses} - ${draws}`;
    }
    return `${wins} - ${losses}`;
}
