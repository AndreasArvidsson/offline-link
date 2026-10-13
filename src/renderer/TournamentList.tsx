import type { JSX } from "preact";
import type { RecentTournament } from "../api.ts";
import { Button } from "./components/Button.tsx";
import type { View } from "./types.ts";
import type { DateFormatter } from "./utils/DateFormatter.ts";
import { statusToString } from "./utils/statusToString.ts";
import "./TournamentList.css";

interface Props {
    tournaments: RecentTournament[];
    dateFormatter: DateFormatter;
    navigate: (view: View) => void;
}

export function TournamentList({
    tournaments,
    dateFormatter,
    navigate,
}: Props): JSX.Element {
    return (
        <section>
            {tournaments.length === 0 && (
                <div>Your saved tournaments will appear here.</div>
            )}

            {tournaments.map((tournament) => (
                <div key={tournament.id} className="mb-2">
                    <Button
                        variant="outline-secondary"
                        className="tournament-list-item"
                        onClick={() => {
                            navigate({ type: "tournament", id: tournament.id });
                        }}
                    >
                        <strong>{tournament.name}</strong>
                        {" · "}
                        {dateFormatter.format(tournament.updatedAt)}
                        {" · "}
                        {tournament.playerCount} players
                        {" · "}
                        {tournament.roundCount} rounds
                        {" · "}
                        <span
                            className={
                                tournament.status === "IN_PROGRESS"
                                    ? "tournament-in-progress"
                                    : undefined
                            }
                        >
                            {statusToString(tournament.status)}
                        </span>
                    </Button>
                </div>
            ))}
        </section>
    );
}
