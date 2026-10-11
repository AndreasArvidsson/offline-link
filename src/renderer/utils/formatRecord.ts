interface Recordish {
    matchWins: number;
    matchLosses: number;
    matchDraws: number;
}

export function formatRecord(
    wins: number,
    losses: number,
    draws: number,
): string {
    return `${wins}-${losses}-${draws}`;
}

export function formatPlayerRecord(record: Recordish): string {
    return formatRecord(
        record.matchWins,
        record.matchLosses,
        record.matchDraws,
    );
}
