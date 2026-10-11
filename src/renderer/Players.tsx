import type { JSX } from "preact";
import { PlusCircle } from "react-bootstrap-icons";
import type { Player } from "../common/models";
import { Button } from "./components/Button";
import { PlayerComponent } from "./Player";
import { StartFirstRound } from "./StartFirstRound";
import { normalizeName } from "./utils/normalizeName";

interface Props {
    disabled: boolean;
    roundCount: number;
    startingTableNumber: number;
    players: Player[];
    onChange: (players: Player[]) => void;
    startFirstRound: (roundCount: number) => void;
}

export function Players({
    disabled,
    roundCount,
    startingTableNumber,
    players,
    onChange,
    startFirstRound,
}: Props): JSX.Element {
    const normalizedPlayerNames = getNormalizedPlayerNames(players);

    const lockedTables = new Set(
        players
            .map((player) => player.lockedTableNumber)
            .filter((tableNumber) => tableNumber != null),
    );

    return (
        <>
            {players.map((player) => (
                <PlayerComponent
                    key={player.id}
                    disabled={disabled}
                    startingTableNumber={startingTableNumber}
                    player={player}
                    normalizedPlayerNames={normalizedPlayerNames}
                    lockedTables={lockedTables}
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

                <StartFirstRound
                    disabled={
                        disabled ||
                        // Minimum 2 players required
                        players.length < 2 ||
                        // Player names must be unique
                        normalizedPlayerNames.size !== players.length ||
                        // Player names cannot be empty
                        normalizedPlayerNames.has("") ||
                        // All locked tables must have valid numbers
                        Array.from(lockedTables).some(
                            (tableNumber) => tableNumber < startingTableNumber,
                        )
                    }
                    playerCount={players.length}
                    roundCount={roundCount}
                    startFirstRound={startFirstRound}
                />
            </div>
        </>
    );
}

function getNormalizedPlayerNames(players: Player[]): Map<string, Set<number>> {
    const res = new Map<string, Set<number>>();

    for (const player of players) {
        const normalized = normalizeName(player.name);
        const existing = res.get(normalized);
        if (existing != null) {
            existing.add(player.id);
        } else {
            res.set(normalized, new Set([player.id]));
        }
    }

    return res;
}
