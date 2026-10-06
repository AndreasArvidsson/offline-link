import type { ComponentChildren, JSX } from "preact";
import { classNames } from "../classNames";
import type { Variant } from "./Variant";

interface Props {
    variant?: Variant | null;
    className?: string;
    title?: string;
    children: ComponentChildren;
}

export function Badge({
    variant = "secondary",
    className,
    title,
    children,
    ...rest
}: Props): JSX.Element {
    return (
        <span
            // oxlint-disable-next-line react/jsx-props-no-spreading
            {...rest}
            title={title}
            className={classNames(
                "badge rounded-pill",
                getVariantClass(variant),
                className,
            )}
        >
            {children}
        </span>
    );
}

function getVariantClass(variant: Variant | null): string | undefined {
    if (variant == null) {
        return undefined;
    }
    switch (variant) {
        case "primary":
            return "bg-primary";
        case "secondary":
            return "bg-secondary";
        case "success":
            return "bg-success";
        case "danger":
            return "bg-danger";
        case "warning":
            return "bg-warning";
        case "info":
            return "bg-info";
        case "light":
            return "bg-light";
        case "dark":
            return "bg-dark";
        default: {
            const _ensureExhaustive: never = variant;
            throw new Error("Unknown Badge variant");
        }
    }
}
