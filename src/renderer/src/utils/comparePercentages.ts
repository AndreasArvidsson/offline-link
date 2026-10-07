const PERCENTAGE_TOLERANCE = 1e-12;

export function comparePercentages(first: number, second: number): number {
    const difference = first - second;
    // Ignore accumulated rounding error so true ties reach the next tiebreaker.
    return Math.abs(difference) < PERCENTAGE_TOLERANCE ? 0 : difference;
}
