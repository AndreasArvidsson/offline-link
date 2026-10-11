import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Button } from "./components/Button";
import type { SelectOption } from "./components/Select";
import { Select } from "./components/Select";
import { calculateNumberOfRounds } from "./utils/calculateNumberOfRounds";
import { getRoundsText } from "./utils/getRoundsText";

interface Props {
    disabled: boolean;
    playerCount: number;
    roundCount: number;
    startFirstRound: (roundCount: number) => void;
}

export function StartFirstRound({
    disabled,
    playerCount,
    roundCount,
    startFirstRound,
}: Props): JSX.Element {
    const [roundCountRecommended, setRoundCountRecommended] = useState(0);
    const [roundCountOverride, setRoundCountOverride] = useState<number>();

    useEffect(() => {
        setRoundCountRecommended(calculateNumberOfRounds(playerCount));
    }, [playerCount]);

    useEffect(() => {
        // Round count has already been set, maybe in a previous session.
        // If the round count is different from the recommended one and hasn't been overridden yet, set the override.
        if (roundCount > 0 && roundCountOverride == null) {
            const recommended = calculateNumberOfRounds(playerCount);
            if (roundCount !== recommended) {
                setRoundCountOverride(roundCount);
            }
        }
    }, []);

    const effectiveRoundCount = roundCountOverride ?? roundCountRecommended;

    return (
        <span className="float-end">
            <Select
                value={roundCountOverride}
                disabled={disabled}
                onChange={(value) => setRoundCountOverride(value)}
            >
                {getOptions(roundCountRecommended)}
            </Select>

            <Button
                variant="success"
                className="mt-3 float-end"
                disabled={disabled || effectiveRoundCount === 0}
                onClick={() => startFirstRound(effectiveRoundCount)}
            >
                Start round 1
            </Button>
        </span>
    );
}

function getOptions(
    roundCountRecommended: number,
): SelectOption<number | undefined>[] {
    return [
        {
            value: undefined,
            children: `${getRoundsText(roundCountRecommended)} (recommended)`,
        },
        ...Array.from({ length: 10 }).map((_, index) => ({
            value: index + 1,
            children: getRoundsText(index + 1),
        })),
    ];
}
