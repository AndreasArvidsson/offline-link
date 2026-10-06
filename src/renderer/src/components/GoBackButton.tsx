import type { JSX } from "preact";
import { ArrowLeft } from "react-bootstrap-icons";
import type { View } from "../types.ts";
import { Button } from "./Button.tsx";

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
