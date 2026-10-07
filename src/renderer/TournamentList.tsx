import type { JSX } from "preact/jsx-runtime";
import type { RecentTournament } from "../api.ts";
import { Button } from "./components/Button.tsx";
import type { View } from "./types.ts";
import type { DateFormatter } from "./utils/DateFormatter.ts";
import { statusToString } from "./utils/statusToString.ts";

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

            {tournaments.map((item) => (
                <div key={item.id} className="mb-2">
                    <Button
                        variant="outline-secondary"
                        onClick={() => {
                            navigate({ type: "tournament", id: item.id });
                        }}
                    >
                        <strong>{item.name}</strong>
                        {getText(item, dateFormatter)}
                    </Button>
                </div>
            ))}
        </section>
    );
}

function getText(
    tournament: RecentTournament,
    dateFormatter: DateFormatter,
): string {
    return [
        "",
        dateFormatter.format(tournament.updatedAt),
        `${tournament.playerCount} players`,
        `${tournament.roundCount} rounds`,
        statusToString(tournament.status),
    ].join(" · ");
}
