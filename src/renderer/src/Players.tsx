import type { JSX } from "preact/jsx-runtime";
import { PlusCircle, Trash3 } from "react-bootstrap-icons";
import type { Player } from "../../common/models";
import { Button } from "./components/Button";
import { InputText } from "./components/InputText";
import { isEmptyString } from "./utils";

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
    return (
        <>
            {players.map((player) => (
                <PlayerComponent
                    key={player.id}
                    player={player}
                    disabled={disabled}
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

            <div className="mt-3">
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
    onChange: (player: Player) => void;
    onRemove: (player: Player) => void;
}

function PlayerComponent({
    player,
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
                invalid={!disabled && isEmptyString(player.name)}
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

function playersAreValid(players: Player[]): boolean {
    return (
        players.length > 1 &&
        players.every((player) => !isEmptyString(player.name))
    );
}
