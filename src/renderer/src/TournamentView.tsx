import { useEffect, useState } from "preact/hooks";
import type { JSX } from "preact/jsx-runtime";
import type { Tournament } from "../../tournament/models.ts";
import { tournamentStatuses } from "../../tournament/models.ts";
import { createNewTournament } from "./createNewTournament.ts";
import type { DateFormatter } from "./DateFormatter.ts";
import { GoBackButton } from "./GoBackButton.tsx";
import { handleError } from "./handleError.ts";
import { InputText } from "./InputText.tsx";
import { Loading } from "./Loading.tsx";
import { Select } from "./Select.tsx";
import type { View } from "./types.ts";
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
                        <td>Name</td>
                        <td>
                            <InputText
                                placeholder="Tournament name"
                                value={tournament.name}
                                onChange={(name) => {
                                    setTournament({ ...tournament, name });
                                }}
                            />
                        </td>
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
                </tbody>
            </table>

            <section>
                <div>
                    <h1>{tournament.name}</h1>
                    <p>
                        {tournament.status === "COMPLETED"
                            ? "Completed · reopen to make corrections"
                            : "In progress"}{" "}
                        · {tournament.players.length} players ·{" "}
                        {tournament.rounds.length} rounds
                    </p>
                </div>
            </section>

            {/* <section>
                <div>
                    <h2>Players</h2>
                    <span>
                        {
                            tournament.players.filter(
                                (p) => p.status === "ACTIVE",
                            ).length
                        }{" "}
                        active
                    </span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Player</th>
                            <th scope="col">Status</th>
                            <th scope="col">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tournament.players.map((player) => (
                            <tr key={player.id}>
                                <th scope="row">
                                    {player.name}
                                    <span class="player-id" title={player.id}>
                                        ID: {player.id.slice(0, 8)}
                                    </span>
                                </th>
                                <td>
                                    {player.status === "ACTIVE"
                                        ? "Active"
                                        : `Dropped after round ${player.droppedAfterRound}`}
                                </td>
                                <td>
                                    <Button
                                        variant="secondary"
                                        disabled={
                                            tournament.status === "COMPLETED"
                                        }
                                        aria-label={`${player.status === "ACTIVE" ? "Drop" : "Reactivate"} ${player.name}, ID ${player.id.slice(0, 8)}`}
                                        onClick={() =>
                                            void onChange({
                                                type: "SET_PLAYER_STATUS",
                                                playerId: player.id,
                                                status:
                                                    player.status === "ACTIVE"
                                                        ? "DROPPED"
                                                        : "ACTIVE",
                                            })
                                        }
                                    >
                                        {player.status === "ACTIVE"
                                            ? "Drop"
                                            : "Reactivate"}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!t.players.length && <p class="empty">No players recorded.</p>}
                <form
                    class="add-player"
                    onSubmit={async (event) => {
                        event.preventDefault();
                        if (
                            await onChange({
                                type: "ADD_PLAYER",
                                name: playerName,
                            })
                        ) {
                            setPlayerName("");
                        }
                    }}
                >
                    <fieldset disabled={busy || completed}>
                        <label for="player-name">Add player</label>
                        <div class="input-action">
                            <input
                                id="player-name"
                                value={playerName}
                                onInput={(event) =>
                                    setPlayerName(event.currentTarget.value)
                                }
                                required
                                maxLength={200}
                            />
                            <Button variant="primary" type="submit">
                                Add & save
                            </Button>
                        </div>
                    </fieldset>
                </form>
            </section>
            <section class="panel" aria-labelledby="details-title">
                <h2 id="details-title">Event details</h2>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void onChange({
                            type: "RENAME",
                            name: title,
                        });
                    }}
                >
                    <fieldset disabled={busy || completed}>
                        <label for="event-name">Tournament name</label>
                        <div class="input-action">
                            <input
                                id="event-name"
                                value={title}
                                onInput={(event) =>
                                    setTitle(event.currentTarget.value)
                                }
                                required
                                maxLength={200}
                            />
                            <Button variant="secondary" type="submit">
                                Save name
                            </Button>
                        </div>
                    </fieldset>
                </form>
                <p class="muted">
                    Changing the name keeps the same file and tournament ID.
                </p>
                <Button
                    variant="secondary"
                    onClick={() => {
                        if (
                            window.confirm(
                                completed
                                    ? "Reopen this event to allow corrections?"
                                    : "Mark this event completed? You can reopen it to make corrections.",
                            )
                        ) {
                            void onChange({
                                type: "SET_EVENT_STATUS",
                                status: completed ? "IN_PROGRESS" : "COMPLETED",
                            });
                        }
                    }}
                >
                    {completed ? "Reopen tournament" : "Complete tournament"}
                </Button>
            </section>
            <aside class="phase-note">
                This first implementation records event details and players.
                Round recording, takeover, Swiss pairings, standings, and
                EventLink re-entry are upcoming phases.
            </aside> */}
        </>
    );
}
