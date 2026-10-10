import type { JSX } from "preact";
import { useState } from "preact/hooks";
import { ChevronDown, ChevronRight } from "react-bootstrap-icons";
import { NA } from "../common/constants";
import type { Player, ParticipationType } from "../common/models";
import { Select } from "./components/Select";

interface Props {
    disabled: boolean;
    players: Player[];
    participationByPlayerId: ReadonlyMap<number, ParticipationType>;
    onChange: (playerId: number, status: ParticipationType | undefined) => void;
}

const choices = [
    { value: "", label: NA },
    { value: "DROPPED", label: "Dropped" },
    { value: "DISQUALIFIED", label: "Disqualified" },
] as const;

export function PlayersDropped({
    disabled,
    players,
    participationByPlayerId,
    onChange,
}: Props): JSX.Element {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="card">
            <div
                className="card-header pointer"
                onClick={() => setExpanded(!expanded)}
            >
                Player participation
                <span className="float-end">
                    {expanded ? <ChevronDown /> : <ChevronRight />}
                </span>
            </div>
            {expanded && (
                <div className="card-body">
                    {players.map((player) => {
                        const participationType = participationByPlayerId.get(
                            player.id,
                        );
                        return (
                            <label
                                key={player.id}
                                className="d-flex align-items-center justify-content-between gap-2 mb-2"
                            >
                                <span>{player.name}</span>
                                <Select
                                    small
                                    className="w-auto"
                                    value={participationType ?? ""}
                                    disabled={disabled}
                                    onChange={(value) =>
                                        onChange(player.id, value || undefined)
                                    }
                                >
                                    {choices.map((choice) => ({
                                        value: choice.value,
                                        children: choice.label,
                                    }))}
                                </Select>
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
