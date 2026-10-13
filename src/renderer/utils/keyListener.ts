import type { Disposable } from "../../common/types";
import { parseKeyboardEvent } from "./parseKeyboardEvent";

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
    if (!e.repeat && parseKeyboardEvent(e) === "F12") {
        e.preventDefault();
        void window.api.toggleDevTools();
    }
}
