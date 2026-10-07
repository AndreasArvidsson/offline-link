import type { JSX } from "preact";
import { useState } from "preact/hooks";
import { ChevronDown, ChevronRight } from "react-bootstrap-icons";
import type { Player, Round } from "../../common/models";
import { InputCheckboxLabel } from "./components/InputCheckboxLabel";

interface Props {
    round: Round;
    players: Player[];
    onChange: (playerId: number, dropped: boolean) => void;
}

export function PlayersDropped({
    players,
    round,
    onChange,
}: Props): JSX.Element {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="card">
            <div
                className="card-header pointer"
                onClick={() => setExpanded(!expanded)}
            >
                Dropped players
                <span className="float-end">
                    {expanded ? <ChevronDown /> : <ChevronRight />}
                </span>
            </div>

            {expanded && (
                <div className="card-body">
                    {players.map((p) => {
                        const dropped = round.droppedPlayerIds.includes(p.id);
                        return (
                            <div key={p.id}>
                                <InputCheckboxLabel
                                    checked={dropped}
                                    onChange={(checked) =>
                                        onChange(p.id, checked)
                                    }
                                >
                                    {p.name}
                                </InputCheckboxLabel>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
