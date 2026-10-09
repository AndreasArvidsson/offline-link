import { useEffect, useState } from "preact/hooks";
import type { JSX } from "preact/jsx-runtime";
import type { RecentTournament } from "../api.ts";
import { APP_NAME } from "../common/constants.ts";
import { GoBackButton } from "./components/GoBackButton.tsx";
import { Loading } from "./components/Loading.tsx";
import { useMessages } from "./Messages.tsx";
import { TournamentList } from "./TournamentList.tsx";
import type { View } from "./types.ts";
import type { DateFormatter } from "./utils/DateFormatter.ts";

interface Props {
    dateFormatter: DateFormatter;
    navigate: (view: View) => void;
}

export function TournamentsView({
    dateFormatter,
    navigate,
}: Props): JSX.Element {
    const [tournaments, setTournaments] = useState<RecentTournament[]>();
    const { addError } = useMessages();

    useEffect(() => {
        window.api.getRecentTournaments().then(setTournaments).catch(addError);
    }, [addError]);

    if (tournaments == null) {
        return <Loading />;
    }

    return (
        <>
            <GoBackButton navigate={navigate} />

            <h1>Tournaments</h1>

            <p>
                All {tournaments.length} tournaments saved in Documents/
                {APP_NAME}.
            </p>

            <TournamentList
                tournaments={tournaments}
                dateFormatter={dateFormatter}
                navigate={navigate}
            />
        </>
    );
}
