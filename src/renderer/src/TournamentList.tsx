import type { JSX } from "preact/jsx-runtime";
import type { RecentTournament } from "../../api.ts";
import { Button } from "./Button.tsx";
import type { DateFormatter } from "./DateFormatter.ts";
import type { View } from "./types.ts";
import { statusToString } from "./utils.ts";

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

            <div>
                {tournaments.map((item) => (
                    <Button
                        variant="outline-secondary"
                        key={item.id}
                        onClick={() => {
                            navigate({ type: "tournament", id: item.id });
                        }}
                    >
                        <span>
                            <strong>{item.name}</strong>
                            <span>
                                {dateFormatter.format(item.updatedAt)} ·{" "}
                                {item.playerCount} players · {item.roundCount}{" "}
                                rounds
                            </span>
                            <span>{item.name}</span>
                        </span>
                        <span>
                            {statusToString(item.status)}
                            <span aria-hidden="true"> →</span>
                        </span>
                    </Button>
                ))}
            </div>
        </section>
    );
}
