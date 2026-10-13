export function parseKeyboardEvent(e: KeyboardEvent): string {
    if (e.isComposing) {
        return "";
    }
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) {
        parts.push("Super");
    }
    // Only include Shift if it's not a single character key (to avoid duplicating with uppercase letters)
    if (e.shiftKey && e.key.length > 1) {
        parts.push("Shift");
    }
    if (e.altKey) {
        parts.push("Alt");
    }
    switch (e.key) {
        case "Control":
        case "Shift":
        case "Alt":
        case "Meta":
            // Do nothing
            break;
        default:
            parts.push(e.key);
    }
    return parts.join("+");
}
