import { useEffect, useState } from "preact/hooks";
import type { JSX } from "preact/jsx-runtime";
import type { Round, Tournament } from "../../common/models.ts";
import { GoBackButton } from "./components/GoBackButton.tsx";
import { InputText } from "./components/InputText.tsx";
import { Loading } from "./components/Loading.tsx";
import { NavItem } from "./components/NavItem.tsx";
import { Players } from "./Players.tsx";
import { RoundComponent } from "./Round.tsx";
import { Standings } from "./Standings.tsx";
import type { View } from "./types.ts";
import { calculateNumberOfRounds } from "./utils/calculateNumberOfRounds.ts";
import { createNewTournament } from "./utils/createNewTournament.ts";
import type { DateFormatter } from "./utils/DateFormatter.ts";
import { generateFirstRound } from "./utils/generateFirstRound.ts";
import { generateNextRound } from "./utils/generateNextRound.ts";
import { handleError } from "./utils/handleError.ts";
import { isEmptyString } from "./utils/isEmptyString.ts";
import { statusToString } from "./utils/statusToString.ts";

interface Props {
    id: string | null;
    dateFormatter: DateFormatter;
    navigate: (view: View) => void;
}

interface SimpleTab {
    type: "players" | "standings";
}

interface RoundTab {
    type: "round";
    round: number;
}

type Tab = SimpleTab | RoundTab;

export function TournamentView({
    id,
    dateFormatter,
    navigate,
}: Props): JSX.Element {
    const [tournament, setTournament] = useState<Tournament>();
    const [tab, setTab] = useState<Tab>();

    useEffect(() => {
        if (id != null) {
            window.api
                .getTournament(id)
                .then((t) => {
                    setTournament(t);
                    setTab(calculateTab(t));
                    return undefined;
                })
                .catch(handleError);
        } else {
            const t = createNewTournament();
            setTournament(t);
            setTab(calculateTab(t));
        }
    }, [id]);

    if (tournament == null || tab == null) {
        return <Loading />;
    }

    const updateTournament = (partial: Partial<Tournament>) => {
        const updated: Tournament = {
            ...tournament,
            ...partial,
            // oxlint-disable-next-line react/purity
            updatedAt: Date.now(),
        };
        setTournament(updated);
        window.api.saveTournament(updated).catch(handleError);
    };

    const disabled = tournament.status === "COMPLETED";

    const startFirstRound = () => {
        const roundCount = calculateNumberOfRounds(tournament.players.length);
        const firstRound = generateFirstRound(tournament.players);
        updateTournament({
            roundCount,
            rounds: [firstRound],
        });
        setTab({ type: "round", round: firstRound.number });
    };

    const startNextRound = () => {
        const rounds = tournament.rounds.map((round, index): Round =>
            index === tournament.rounds.length - 1
                ? { ...round, status: "COMPLETED" }
                : round,
        );
        if (rounds.length < tournament.roundCount) {
            const nextRound = generateNextRound({ ...tournament, rounds });
            rounds.push(nextRound);
            setTab({ type: "round", round: nextRound.number });
            updateTournament({ rounds });
        } else {
            updateTournament({
                rounds,
                status: "COMPLETED",
            });
            setTab({ type: "standings" });
        }
    };

    const renderTab = () => {
        const { type } = tab;
        switch (type) {
            case "players":
                return (
                    <Players
                        disabled={disabled || tournament.roundCount > 0}
                        players={tournament.players}
                        startFirstRound={startFirstRound}
                        onChange={(players) => updateTournament({ players })}
                    />
                );

            case "standings":
                return <Standings tournament={tournament} />;

            case "round": {
                const round = tournament.rounds.find(
                    (r) => r.number === tab.round,
                );
                if (round == null) {
                    throw new Error("Round not found");
                }
                return (
                    <RoundComponent
                        disabled={disabled || round.status === "COMPLETED"}
                        round={round}
                        players={tournament.players}
                        isLastRound={round.number === tournament.roundCount}
                        startNextRound={startNextRound}
                        onChange={(updatedRound) => {
                            updateTournament({
                                rounds: tournament.rounds.map((r) =>
                                    r.number === updatedRound.number
                                        ? updatedRound
                                        : r,
                                ),
                            });
                        }}
                    />
                );
            }

            default: {
                const _exhaustiveCheck: never = type;
                throw new Error("Unhandled tab type");
            }
        }
    };

    return (
        <>
            <GoBackButton navigate={navigate} />

            <h1>Tournament</h1>

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
                                    updateTournament({ name });
                                }}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>

            <p>
                {tournament.roundCount > 0 && (
                    <span>
                        {tournament.players.length} players{" · "}
                        {tournament.roundCount} rounds
                    </span>
                )}

                <span className="float-end">
                    {statusToString(tournament.status)}
                </span>
            </p>

            <ul className="nav nav-tabs mb-3">
                <NavItem
                    active={tab.type === "players"}
                    onClick={() => {
                        setTab({ type: "players" });
                    }}
                >
                    Players
                </NavItem>
                {tournament.rounds.map((round) => (
                    <NavItem
                        key={round.number}
                        active={
                            tab.type === "round" && tab.round === round.number
                        }
                        onClick={() => {
                            setTab({ type: "round", round: round.number });
                        }}
                    >
                        Round {round.number}
                    </NavItem>
                ))}
                {tournament.roundCount > 0 && (
                    <NavItem
                        active={tab.type === "standings"}
                        onClick={() => {
                            setTab({ type: "standings" });
                        }}
                    >
                        Standings
                    </NavItem>
                )}
            </ul>

            {renderTab()}
        </>
    );
}

function calculateTab(tournament: Tournament): Tab {
    if (tournament.rounds.length > 0) {
        if (tournament.status === "COMPLETED") {
            return { type: "standings" };
        }
        return {
            type: "round",
            round: tournament.rounds[tournament.rounds.length - 1].number,
        };
    }
    return { type: "players" };
}
