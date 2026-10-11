import type { JSX } from "preact";
import { ConfirmModal } from "./ConfirmModal";
import { Popover } from "./Popover";

interface Props {
    header?: string;
    children: JSX.Element;
    onClick: () => void;
}

export function Confirm({ header, children, onClick }: Props): JSX.Element {
    return (
        <Popover
            // oxlint-disable-next-line react/no-unstable-nested-components
            overlay={(hide) => (
                <ConfirmModal
                    header={header}
                    resolve={() => {
                        onClick();
                        hide();
                    }}
                    reject={hide}
                />
            )}
        >
            {children}
        </Popover>
    );
}
