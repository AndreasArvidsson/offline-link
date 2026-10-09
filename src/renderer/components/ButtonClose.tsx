import type { JSX } from "preact";

interface Props {
    title: string;
    onClick: () => void;
}

export function ButtonClose({ title, onClick }: Props): JSX.Element {
    return (
        <button
            type="button"
            className="btn-close"
            title={title}
            aria-label={title}
            onClick={onClick}
        />
    );
}
