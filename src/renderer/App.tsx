import { useEffect, useState } from "preact/hooks";
import type { JSX } from "preact/jsx-runtime";
import type { Parameters } from "../api.ts";
import { Loading } from "./components/Loading.tsx";
import { HomeView } from "./HomeView.tsx";
import { Messages, useMessages } from "./Messages.tsx";
import { TournamentsView } from "./TournamentsView.tsx";
import { TournamentView } from "./TournamentView.tsx";
import type { View } from "./types.ts";
import { DateFormatter } from "./utils/DateFormatter.ts";
import { initializeKeyListener } from "./utils/keyListener.ts";

export function App(): JSX.Element {
    const [view, setView] = useState<View>({ type: "home" });
    const [parameters, setParameters] = useState<Parameters>();
    const { addError } = useMessages();

    useEffect(() => {
        window.api.getParameters().then(setParameters).catch(addError);
        const disposable = initializeKeyListener();
        return () => {
            disposable.dispose();
        };
    }, [addError]);

    const renderView = () => {
        if (parameters == null) {
            return <Loading />;
        }

        const dateFormatter = new DateFormatter(parameters.locale);

        switch (view.type) {
            case "home":
                return (
                    <HomeView
                        navigate={setView}
                        dateFormatter={dateFormatter}
                    />
                );
            case "tournaments":
                return (
                    <TournamentsView
                        navigate={setView}
                        dateFormatter={dateFormatter}
                    />
                );
            case "tournament":
                return (
                    <TournamentView
                        navigate={setView}
                        id={view.id}
                        dateFormatter={dateFormatter}
                    />
                );
            case "tournamentNew":
                return (
                    <TournamentView
                        navigate={setView}
                        id={null}
                        dateFormatter={dateFormatter}
                    />
                );
            default: {
                const _exhaustiveCheck: never = view;
                throw new Error("Unhandled view type");
            }
        }
    };

    return (
        <div className="d-flex flex-column min-vh-100 pt-3">
            <Messages />
            {renderView()}
        </div>
    );
}
