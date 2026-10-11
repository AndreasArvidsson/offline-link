import type { JSX } from "preact";
import { Trash3 } from "react-bootstrap-icons";
import type { Player } from "../common/models";
import { Button } from "./components/Button";
import { InputText } from "./components/InputText";
import { LockedTable } from "./LockedTable";
import { normalizeName } from "./utils/normalizeName";

interface Props {
    disabled: boolean;
    startingTableNumber: number;
    player: Player;
    normalizedPlayerNames: Map<string, Set<number>>;
    lockedTables: Set<number>;
    onChange: (player: Player) => void;
    onRemove: (player: Player) => void;
}

export function PlayerComponent({
    disabled,
    startingTableNumber,
    player,
    normalizedPlayerNames,
    lockedTables,
    onChange,
    onRemove,
}: Props): JSX.Element {
    return (
        <div key={player.id} className="input-group mb-2">
            <InputText
                placeholder="Player name"
                value={player.name}
                disabled={disabled}
                invalid={
                    !disabled && !validatePlayer(player, normalizedPlayerNames)
                }
                onChange={(name) => {
                    onChange({ ...player, name });
                }}
            />

            <LockedTable
                disabled={disabled}
                startingTableNumber={startingTableNumber}
                lockedTableNumber={player.lockedTableNumber}
                lockedTables={lockedTables}
                onChange={(lockedTableNumber) => {
                    onChange({ ...player, lockedTableNumber });
                }}
            />

            <span className="input-group-text" />

            <Button
                variant="danger"
                disabled={disabled}
                title="Remove player"
                onClick={() => {
                    onRemove(player);
                }}
            >
                <Trash3 />
            </Button>
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
