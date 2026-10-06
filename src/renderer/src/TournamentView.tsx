import { useEffect, useState } from "preact/hooks";
import type { JSX } from "preact/jsx-runtime";
import type { Tournament } from "../../common/models.ts";
import { tournamentStatuses } from "../../common/models.ts";
import { Button } from "./Button.tsx";
import { calculateNumberOfRounds } from "./calculateNumberOfRounds.ts";
import { createNewTournament } from "./createNewTournament.ts";
import type { DateFormatter } from "./DateFormatter.ts";
import { generateFirstRound } from "./generateFirstRound.ts";
import { GoBackButton } from "./GoBackButton.tsx";
import { handleError } from "./handleError.ts";
import { InputText } from "./InputText.tsx";
import { Loading } from "./Loading.tsx";
import { Players, playersAreValid } from "./Players.tsx";
import { Rounds } from "./Rounds.tsx";
import { Select } from "./Select.tsx";
import type { View } from "./types.ts";
import { isEmptyString } from "./utils";
import { statusToString } from "./utils.ts";

interface Props {
    id: string | null;
    dateFormatter: DateFormatter;
    navigate: (view: View) => void;
}

export function TournamentView({
    id,
    dateFormatter,
    navigate,
}: Props): JSX.Element {
    const [tournament, setTournament] = useState<Tournament>();

    useEffect(() => {
        if (id != null) {
            window.api.getTournament(id).then(setTournament).catch(handleError);
        } else {
            setTournament(createNewTournament());
        }
    }, [id]);

    if (tournament == null) {
        return <Loading />;
    }

    const disabled = tournament.status === "COMPLETED";

    const renderRounds = () => {
        if (tournament.roundCount > 0) {
            return (
                <Rounds
                    disabled={disabled}
                    totalRounds={tournament.roundCount}
                    rounds={tournament.rounds}
                    onChange={(rounds) => {
                        setTournament({ ...tournament, rounds });
                    }}
                />
            );
        }

        return (
            <Button
                variant="success"
                disabled={disabled || !playersAreValid(tournament.players)}
                onClick={() => {
                    const roundCount = calculateNumberOfRounds(
                        tournament.players.length,
                    );
                    const firstRound = generateFirstRound(tournament.players);
                    setTournament({
                        ...tournament,
                        roundCount,
                        rounds: [firstRound],
                    });
                }}
            >
                START!
            </Button>
        );
    };

    return (
        <>
            <h1>Edit tournament</h1>

            <GoBackButton navigate={navigate} />

            <table className="table">
                <tbody>
                    <tr>
                        <td>Created</td>
                        <td>{dateFormatter.format(tournament.createdAt)}</td>
                    </tr>
                    <tr>
                        <td>Updated</td>
                        <td>{dateFormatter.format(tournament.updatedAt)}</td>
                    </tr>
                    <tr>
                        <td>Status</td>
                        <td>
                            <Select
                                value={tournament.status}
                                onChange={(status) => {
                                    setTournament({ ...tournament, status });
                                }}
                            >
                                {tournamentStatuses.map((status) => ({
                                    value: status,
                                    children: statusToString(status),
                                }))}
                            </Select>
                        </td>
                    </tr>
                    <tr>
                        <td>Name</td>
                        <td>
                            <InputText
                                placeholder="Tournament name"
                                value={tournament.name}
                                disabled={disabled}
                                invalid={
                                    !disabled && isEmptyString(tournament.name)
                                }
                                onChange={(name) => {
                                    setTournament({ ...tournament, name });
                                }}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>

            <Players
                disabled={disabled || tournament.roundCount > 0}
                players={tournament.players}
                onChange={(players) => {
                    setTournament({ ...tournament, players });
                }}
            />

            {renderRounds()}
        </>
    );
}
