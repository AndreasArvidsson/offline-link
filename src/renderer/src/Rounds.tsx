import type { JSX } from "preact/jsx-runtime";
import type { Round } from "../../common/models";
import { Badge } from "./Badge";

interface Props {
    disabled: boolean;
    totalRounds: number;
    rounds: Round[];
    onChange: (rounds: Round[]) => void;
}

export function Rounds({
    disabled,
    totalRounds,
    rounds,
    onChange,
}: Props): JSX.Element {
    return (
        <section>
            <h2>
                Rounds
                <small className="ms-2">
                    <Badge>
                        {rounds.length} / {totalRounds}
                    </Badge>
                </small>
            </h2>

            {/* <Button
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
                </Button> */}

            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Round</th>
                        <th />
                    </tr>
                </thead>
                <tbody>
                    {/* {rounds.map((round) => (
                        ))} */}
                </tbody>
            </table>
        </section>
    );
}
