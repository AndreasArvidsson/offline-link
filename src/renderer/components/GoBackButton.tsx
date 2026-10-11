import type { JSX } from "preact";
import { useCallback, useEffect } from "preact/hooks";
import { ArrowLeft } from "react-bootstrap-icons";
import type { View } from "../types.ts";
import { Button } from "./Button.tsx";

export function GoBackButton({
    navigate,
}: {
    navigate: (view: View) => void;
}): JSX.Element {
    const goBack = useCallback(() => {
        const activeElement = document.activeElement;

        if (activeElement instanceof HTMLElement) {
            activeElement.blur();
        }

        navigate({ type: "home" });
    }, [navigate]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (
                event.key === "ArrowLeft" &&
                event.altKey &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.shiftKey
            ) {
                event.preventDefault();
                goBack();
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [goBack]);

    return (
        <Button
            variant="secondary"
            title="Go back (Alt+Left)"
            aria-keyshortcuts="Alt+ArrowLeft"
            onClick={goBack}
        >
            <ArrowLeft /> Go back
        </Button>
    );
}
