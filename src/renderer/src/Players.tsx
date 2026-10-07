import type { JSX } from "preact/jsx-runtime";
import { PlusCircle, Trash3 } from "react-bootstrap-icons";
import type { Player } from "../../common/models";
import { Button } from "./components/Button";
import { InputText } from "./components/InputText";

interface Props {
    disabled: boolean;
    players: Player[];
    onChange: (players: Player[]) => void;
    startFirstRound: () => void;
}

export function Players({
    disabled,
    players,
    onChange,
    startFirstRound,
}: Props): JSX.Element {
    const playersMap = getPlayersMap(players);

    return (
        <>
            {players.map((player) => (
                <PlayerComponent
                    key={player.id}
                    disabled={disabled}
                    player={player}
                    playersMap={playersMap}
                    onChange={(updatedPlayer) => {
                        onChange(
                            players.map((p) =>
                                p.id === updatedPlayer.id ? updatedPlayer : p,
                            ),
                        );
                    }}
                    onRemove={() => {
                        onChange(players.filter((p) => p.id !== player.id));
                    }}
                />
            ))}

            <div className="mt-4">
                <Button
                    variant="primary"
                    disabled={disabled}
                    onClick={() => {
                        const highest = players.reduce(
                            (max, player) => Math.max(max, player.id),
                            0,
                        );
                        const newPlayer: Player = {
                            id: highest + 1,
                            name: "",
                        };
                        onChange([...players, newPlayer]);
                    }}
                >
                    <PlusCircle /> Add Player
                </Button>

                <Button
                    variant="success"
                    className="float-end"
                    disabled={disabled || !playersAreValid(players)}
                    onClick={startFirstRound}
                >
                    Start round 1
                </Button>
            </div>
        </>
    );
}

interface PlayerProps {
    disabled: boolean;
    player: Player;
    playersMap: Map<string, Set<number>>;
    onChange: (player: Player) => void;
    onRemove: (player: Player) => void;
}

function PlayerComponent({
    player,
    playersMap,
    onChange,
    onRemove,
    disabled,
}: PlayerProps) {
    return (
        <div key={player.id} className="input-group mb-2">
            <InputText
                placeholder="Player name"
                value={player.name}
                disabled={disabled}
                invalid={!disabled && !validatePlayer(player, playersMap)}
                onChange={(name) => {
                    onChange({ ...player, name });
                }}
            />

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
    playersMap: Map<string, Set<number>>,
): boolean {
    const normalized = normalizeName(player.name);
    if (normalized === "") {
        return false;
    }
    const existing = playersMap.get(normalized);
    if (existing != null && (existing.size > 1 || !existing.has(player.id))) {
        return false;
    }
    return true;
}

function getPlayersMap(players: Player[]): Map<string, Set<number>> {
    const playersMap = new Map<string, Set<number>>();
    for (const player of players) {
        const normalized = normalizeName(player.name);
        const existing = playersMap.get(normalized);
        if (existing != null) {
            existing.add(player.id);
        } else {
            playersMap.set(normalized, new Set([player.id]));
        }
    }
    return playersMap;
}

function playersAreValid(players: Player[]): boolean {
    if (players.length < 2) {
        return false;
    }
    const names = new Set(players.map((player) => normalizeName(player.name)));
    return names.size === players.length && !names.has("");
}

function normalizeName(name: string): string {
    return name.trim().toLocaleLowerCase();
}
