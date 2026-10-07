export function handleError(error: unknown): void {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    // oxlint-disable-next-line no-alert
    alert(message);
}
