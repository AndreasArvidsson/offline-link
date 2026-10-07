import type { JSX } from "preact/jsx-runtime";
import { PersonFillDash, PersonFillX } from "react-bootstrap-icons";
import type { ParticipationType } from "../../../common/models";

export function IconParticipationChange({
    type,
}: {
    type: ParticipationType | undefined;
}): JSX.Element | null {
    if (type == null) {
        return null;
    }
    switch (type) {
        case "DROPPED":
            return <PersonFillDash title="Dropped from the tournament" />;
        case "DISQUALIFIED":
            return (
                <PersonFillX
                    title="Disqualified from the tournament"
                    className="text-danger"
                />
            );
        default: {
            const _exhaustiveCheck: never = type;
            throw new Error("Unhandled participation type");
        }
    }
}
