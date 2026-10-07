import { useEffect, useState } from "preact/hooks";
import type { JSX } from "preact/jsx-runtime";
import { PlusCircle } from "react-bootstrap-icons";
import type { RecentTournament } from "../../api.ts";
import { APP_NAME } from "../../common/constants.ts";
import { Button } from "./components/Button.tsx";
import { TournamentList } from "./TournamentList.tsx";
import type { View } from "./types.ts";
import type { DateFormatter } from "./utils/DateFormatter.ts";
import { handleError } from "./utils/handleError.ts";

const RECENT_LIMIT = 10;

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
        <div className="d-flex flex-column min-vh-100">
            <header>
                <h1>{APP_NAME}</h1>
                <p>Your local tournament notebook</p>
            </header>

            <main className="flex-grow-1">
                <Button
                    variant="primary"
                    onClick={() => {
                        navigate({ type: "tournamentNew" });
                    }}
                >
                    <PlusCircle /> New Tournament
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

                <h2>Recent tournaments</h2>

                <TournamentList
                    tournaments={tournaments.slice(0, RECENT_LIMIT)}
                    dateFormatter={dateFormatter}
                    navigate={navigate}
                />
            </main>

            <footer className="p-3">
                Unofficial software. {APP_NAME} is not affiliated with Wizards
                of the Coast. Official event reporting remains in EventLink.
            </footer>
        </div>
    );
}
