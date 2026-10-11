import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import type { Round, Tournament } from "../common/models.ts";
import { GoBackButton } from "./components/GoBackButton.tsx";
import { InputNumber } from "./components/InputNumber.tsx";
import { InputText } from "./components/InputText.tsx";
import { Loading } from "./components/Loading.tsx";
import { NavItem } from "./components/NavItem.tsx";
import { useMessages } from "./Messages.tsx";
import { Players } from "./Players.tsx";
import { RoundComponent } from "./Round.tsx";
import { Standings } from "./Standings.tsx";
import type { View } from "./types.ts";
import { calculateRecords } from "./utils/calculateRecords.ts";
import { createNewTournament } from "./utils/createNewTournament.ts";
import type { DateFormatter } from "./utils/DateFormatter.ts";
import { generateFirstRound } from "./utils/generateFirstRound.ts";
import { generateNextRound } from "./utils/generateNextRound.ts";
import { getRoundsText } from "./utils/getRoundsText.ts";
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
    const { addError } = useMessages();

    useEffect(() => {
        if (id != null) {
            window.api
                .getTournament(id)
                .then((t) => {
                    setTournament(t);
                    setTab(calculateTab(t));
                    return undefined;
                })
                .catch(addError);
        } else {
            const t = createNewTournament();
            setTournament(t);
            setTab(calculateTab(t));
        }
    }, [id, addError]);

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
        window.api.saveTournament(updated).catch(addError);
    };

    const disabled = tournament.status === "COMPLETED";
    const invalidName = !disabled && isEmptyString(tournament.name);

    const startFirstRound = (roundCount: number) => {
        const firstRound = generateFirstRound(
            tournament.players,
            tournament.startingTableNumber,
        );
        updateTournament({
            status: "IN_PROGRESS",
            roundCount,
            players: tournament.players.map((player) => ({
                ...player,
                name: player.name.trim(),
            })),
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
            try {
                const nextRound = generateNextRound({ ...tournament, rounds });
                rounds.push(nextRound);
                setTab({ type: "round", round: nextRound.number });
                updateTournament({ rounds });
            } catch (error) {
                addError(error);
            }
        } else {
            updateTournament({
                rounds,
                status: "COMPLETED",
            });
            setTab({ type: "standings" });
        }
    };

    const renderTab = () => {
        if (invalidName) {
            return null;
        }

        switch (tab.type) {
            case "players":
                return (
                    <Players
                        disabled={disabled || tournament.roundCount > 0}
                        roundCount={tournament.roundCount}
                        startingTableNumber={tournament.startingTableNumber}
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
                const playerRecords = calculateRecords(
                    tournament,
                    round.number - 1,
                );
                return (
                    <RoundComponent
                        disabled={disabled || round.status === "COMPLETED"}
                        round={round}
                        players={tournament.players}
                        playerRecords={playerRecords}
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
                const _exhaustiveCheck: never = tab;
                throw new Error("Unhandled tab type");
            }
        }
    };

    return (
        <>
            <header>
                <GoBackButton navigate={navigate} />

                <h1>Tournament</h1>
            </header>

            <main>
                <table className="table">
                    <tbody>
                        <tr>
                            <td>Created</td>
                            <td>
                                {dateFormatter.format(tournament.createdAt)}
                            </td>
                        </tr>
                        <tr>
                            <td>Updated</td>
                            <td>
                                {dateFormatter.format(tournament.updatedAt)}
                            </td>
                        </tr>
                        <tr>
                            <td>Name</td>
                            <td>
                                <InputText
                                    placeholder="Tournament name"
                                    value={tournament.name}
                                    disabled={disabled}
                                    invalid={invalidName}
                                    onChange={(name) => {
                                        updateTournament({ name });
                                    }}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>Starting table #</td>
                            <td>
                                <InputNumber
                                    value={tournament.startingTableNumber}
                                    disabled={disabled}
                                    isInteger
                                    onChange={(value) => {
                                        updateTournament({
                                            startingTableNumber: value ?? 1,
                                        });
                                    }}
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div className="d-flex gap-2 mb-3">
                    {tournament.roundCount > 0 && (
                        <span>
                            {tournament.players.length} players{" · "}
                            {getRoundsText(tournament.roundCount)}
                        </span>
                    )}

                    <span className="ms-auto">
                        {statusToString(tournament.status)}
                    </span>
                </div>

                {!invalidName && (
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
                                    tab.type === "round" &&
                                    tab.round === round.number
                                }
                                onClick={() => {
                                    setTab({
                                        type: "round",
                                        round: round.number,
                                    });
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
                )}

                {renderTab()}
            </main>
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
