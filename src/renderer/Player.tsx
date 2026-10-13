import type { JSX } from "preact";
import { useLayoutEffect, useRef } from "preact/hooks";
import { Trash3 } from "react-bootstrap-icons";
import type { Player } from "../common/models";
import { Button } from "./components/Button";
import { Confirm } from "./components/Confirm";
import { InputText } from "./components/InputText";
import { LockedTable } from "./LockedTable";
import { normalizeName } from "./utils/normalizeName";
import { parseKeyboardEvent } from "./utils/parseKeyboardEvent";

interface Props {
    disabled: boolean;
    startingTableNumber: number;
    player: Player;
    autoFocus: boolean;
    normalizedPlayerNames: Map<string, Set<number>>;
    lockedTables: Set<number>;
    onChange: (player: Player) => void;
    onRemove: (player: Player) => void;
    onEnter: () => void;
}

export function PlayerComponent({
    onEnter,
    disabled,
    startingTableNumber,
    player,
    autoFocus,
    normalizedPlayerNames,
    lockedTables,
    onChange,
    onRemove,
}: Props): JSX.Element {
    const ref = useRef<HTMLInputElement>(null);

    useLayoutEffect(() => {
        if (autoFocus) {
            ref.current?.focus();
        }
    }, [autoFocus]);

    return (
        <div key={player.id} className="input-group mb-2">
            <InputText
                ref={ref}
                placeholder="Player name"
                value={player.name}
                disabled={disabled}
                invalid={
                    !disabled && !validatePlayer(player, normalizedPlayerNames)
                }
                onChange={(name) => {
                    onChange({ ...player, name });
                }}
                onKeyDown={(e) => {
                    if (!e.repeat && parseKeyboardEvent(e) === "Enter") {
                        e.preventDefault();
                        onEnter();
                    }
                }}
            />

            <LockedTable
                disabled={disabled}
                startingTableNumber={startingTableNumber}
                lockedTableNumber={player.lockedTableNumber}
                lockedTables={lockedTables}
                onEnter={onEnter}
                onChange={(lockedTableNumber) =>
                    onChange({ ...player, lockedTableNumber })
                }
            />

            <span className="input-group-text" />

            <Confirm onClick={() => onRemove(player)}>
                <Button
                    variant="danger"
                    disabled={disabled}
                    title="Remove player"
                >
                    <Trash3 />
                </Button>
            </Confirm>
        </div>
    );
}

function validatePlayer(
    player: Player,
    normalizedPlayerNames: Map<string, Set<number>>,
): boolean {
    const normalized = normalizeName(player.name);
    if (normalized === "") {
        return false;
    }
    const existing = normalizedPlayerNames.get(normalized);
    if (existing != null && (existing.size > 1 || !existing.has(player.id))) {
        return false;
    }
    return true;
}
