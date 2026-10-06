import type { JSX } from "preact/jsx-runtime";
import { ArrowLeft } from "react-bootstrap-icons";
import { Button } from "./Button.tsx";
import type { View } from "./types.ts";

export function GoBackButton({
    navigate,
}: {
    navigate: (view: View) => void;
}): JSX.Element {
    return (
        <Button
            variant="secondary"
            onClick={() => {
                navigate({ type: "home" });
            }}
        >
            <ArrowLeft /> Go back
        </Button>
    );
}
