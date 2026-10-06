import type { JSX } from "preact/jsx-runtime";
import { PlusCircle, Trash3 } from "react-bootstrap-icons";
import type { Player } from "../../common/models";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { InputText } from "./InputText";
import { isEmptyString } from "./utils";

interface Props {
    disabled: boolean;
    players: Player[];
    onChange: (players: Player[]) => void;
}

export function Players({ disabled, players, onChange }: Props): JSX.Element {
    return (
        <section>
            <h2>
                Players
                <small className="ms-2">
                    {players.length > 1 || disabled ? (
                        <Badge>{players.length}</Badge>
                    ) : (
                        <Badge
                            variant="danger"
                            title="At least 2 players are required"
                        >
                            {players.length}
                        </Badge>
                    )}
                </small>
            </h2>

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

            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Player</th>
                        <th />
                    </tr>
                </thead>
                <tbody>
                    {players.map((player) => (
                        <PlayerComponent
                            key={player.id}
                            player={player}
                            disabled={disabled}
                            onChange={(updatedPlayer) => {
                                onChange(
                                    players.map((p) =>
                                        p.id === updatedPlayer.id
                                            ? updatedPlayer
                                            : p,
                                    ),
                                );
                            }}
                            onRemove={() => {
                                onChange(
                                    players.filter((p) => p.id !== player.id),
                                );
                            }}
                        />
                    ))}
                </tbody>
            </table>
        </section>
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
        <tr key={player.id}>
            <td>{player.id}</td>

            <td>
                <InputText
                    placeholder="Player name"
                    value={player.name}
                    disabled={disabled}
                    invalid={!disabled && isEmptyString(player.name)}
                    onChange={(name) => {
                        onChange({ ...player, name });
                    }}
                />
            </td>

            <td>
                <Button
                    variant="danger"
                    small
                    disabled={disabled}
                    title="Remove player"
                    onClick={() => {
                        onRemove(player);
                    }}
                >
                    <Trash3 />
                </Button>
            </td>
        </tr>
    );
}

export function playersAreValid(players: Player[]): boolean {
    return (
        players.length > 1 &&
        players.every((player) => !isEmptyString(player.name))
    );
}
