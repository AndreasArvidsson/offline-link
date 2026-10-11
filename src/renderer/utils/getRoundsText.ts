export function getRoundsText(roundCount: number): string {
    if (roundCount === 1) {
        return "1 round";
    }
    return `${roundCount} rounds`;
}
