import { useEffect, useState } from "preact/hooks";
import type { JSX } from "preact/jsx-runtime";
import type { RecentTournament } from "../../api.ts";
import { APP_NAME } from "../../common/constants.ts";
import { Button } from "./Button.tsx";
import type { DateFormatter } from "./DateFormatter.ts";
import { handleError } from "./handleError.ts";
import { TournamentList } from "./TournamentList.tsx";
import type { View } from "./types.ts";

interface Props {
    dateFormatter: DateFormatter;
    navigate: (view: View) => void;
}

export function HomeView({ dateFormatter, navigate }: Props): JSX.Element {
    const [tournaments, setTournaments] = useState<RecentTournament[]>([]);

    useEffect(() => {
        window.api
            .getRecentTournaments()
            .then(setTournaments)
            .catch(handleError);
    }, []);

    return (
        <>
            <header>
                <h1>{APP_NAME}</h1>
                <p>Your local tournament notebook</p>
            </header>

            <main>
                <Button
                    variant="primary"
                    onClick={() => {
                        navigate({ type: "tournamentNew" });
                    }}
                >
                    + New Tournament
                </Button>

                <Button
                    variant="secondary"
                    className="ms-3"
                    onClick={() => {
                        navigate({ type: "tournaments" });
                    }}
                >
                    All tournaments
                </Button>

                <hr />

                <h2>Recent Tournaments</h2>

                <TournamentList
                    tournaments={tournaments.slice(0, 5)}
                    dateFormatter={dateFormatter}
                    navigate={navigate}
                />
            </main>

            <footer>
                Unofficial software. {APP_NAME} is not affiliated with Wizards
                of the Coast. Official event reporting remains in EventLink.
            </footer>
        </>
    );
}
