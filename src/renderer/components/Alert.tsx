import type { ComponentChildren, JSX } from "preact";
import { classNames } from "../utils/classNames";
import { ButtonClose } from "./ButtonClose";
import type { Variant } from "./Variant";

interface Props {
    variant: Variant;
    closeText?: string;
    className?: string;
    onClose?: () => void;
    children: ComponentChildren;
}

export function Alert({
    variant,
    closeText = "Close",
    className,
    onClose,
    children,
}: Props): JSX.Element {
    return (
        <div
            role="alert"
            className={classNames(
                "alert",
                getVariantClass(variant),
                onClose != null && "alert-dismissible",
                className,
            )}
        >
            {onClose != null && (
                <ButtonClose title={closeText} onClick={onClose} />
            )}
            {children}
        </div>
    );
}

function getVariantClass(variant: Variant): string {
    switch (variant) {
        case "primary":
            return "alert-primary";
        case "secondary":
            return "alert-secondary";
        case "success":
            return "alert-success";
        case "danger":
            return "alert-danger";
        case "warning":
            return "alert-warning";
        case "info":
            return "alert-info";
        case "light":
            return "alert-light";
        case "dark":
            return "alert-dark";
        default: {
            const _ensureExhaustive: never = variant;
            throw new Error("Unknown Alert variant");
        }
    }
}
