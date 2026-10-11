import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Lock } from "react-bootstrap-icons";
import { Button } from "./components/Button";
import { InputNumber } from "./components/InputNumber";
import "./LockedTable.css";

interface Props {
    disabled: boolean;
    startingTableNumber: number;
    lockedTableNumber?: number;
    lockedTables: Set<number>;
    onChange: (lockedTableNumber?: number) => void;
}

export function LockedTable({
    disabled,
    startingTableNumber,
    lockedTableNumber,
    lockedTables,
    onChange,
}: Props): JSX.Element {
    const [lockedTableInput, setLockedTableInput] = useState<number>();
    const isTableLocked = lockedTableNumber != null;

    const validationError = ((): string | undefined => {
        if (lockedTableInput == null) {
            return undefined;
        }
        if (lockedTableInput < startingTableNumber) {
            return `Table number must be greater than or equal to the starting table number ${startingTableNumber}`;
        }
        if (
            lockedTableInput !== lockedTableNumber &&
            lockedTables.has(lockedTableInput)
        ) {
            return `Table number is already locked`;
        }
        return undefined;
    })();

    const isValid = validationError == null;

    useEffect(() => {
        setLockedTableInput(lockedTableNumber);
    }, [lockedTableNumber]);

    const lockTableClicked = () => {
        if (lockedTableInput == null) {
            onChange(
                getFirstAvailableTableNumber(startingTableNumber, lockedTables),
            );
        } else {
            onChange(undefined);
        }
    };

    return (
        <>
            {isTableLocked && (
                <InputNumber
                    placeholder="Table #"
                    title={validationError ?? "Locked table number"}
                    className="locked-table-number"
                    disabled={disabled}
                    value={lockedTableInput}
                    invalid={!isValid}
                    min={startingTableNumber}
                    isInteger
                    onChange={setLockedTableInput}
                    onBlur={() => {
                        if (isValid) {
                            onChange(lockedTableInput);
                        } else {
                            setLockedTableInput(lockedTableNumber);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.currentTarget.blur();
                            e.preventDefault();
                        }
                    }}
                />
            )}

            {!isTableLocked && (
                <Button
                    variant="secondary"
                    disabled={disabled}
                    title="Table lock"
                    className="locked-table-number"
                    onClick={lockTableClicked}
                >
                    <Lock />
                </Button>
            )}
        </>
    );
}

function getFirstAvailableTableNumber(
    startingTableNumber: number,
    lockedTables: Set<number>,
): number {
    let tableNumber = startingTableNumber;
    while (lockedTables.has(tableNumber)) {
        tableNumber++;
    }
    return tableNumber;
}
