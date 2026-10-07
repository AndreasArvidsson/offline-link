import type { Disposable } from "../../../common/types";

let initialized = false;

export function initializeKeyListener(): Disposable {
    if (initialized) {
        return {
            dispose: () => {
                // noop
            },
        };
    }

    initialized = true;
    window.addEventListener("keydown", keyDownListener);

    return {
        dispose: () => {
            window.removeEventListener("keydown", keyDownListener);
            initialized = false;
        },
    };
}

function keyDownListener(e: KeyboardEvent) {
    const key = parseEvent(e);

    if (key === "F12") {
        void window.api.toggleDevTools();
        e.preventDefault();
    }
}

export function isNormal(event: KeyboardEvent): boolean {
    return !event.ctrlKey && !event.altKey && !event.metaKey;
}

function parseEvent(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) {
        parts.push("super");
    }
    switch (e.key) {
        case "Control":
        case "Alt":
        case "Shift":
        case "Meta":
            // Do nothing
            break;
        default:
            parts.push(e.key);
    }
    return parts.join("+");
}
