import type { ButtonHTMLAttributes, Ref } from "preact";
import { forwardRef } from "preact/compat";
import { classNames } from "../utils/classNames";
import type { Variant } from "./Variant";

export type ButtonVariant = Variant | "link" | `outline-${Variant}`;

interface Props extends ButtonHTMLAttributes {
    variant: ButtonVariant | null;
    small?: boolean;
    className?: string;
}

export const Button = forwardRef(
    // oxlint-disable-next-line react/function-component-definition
    (
        { variant, small, className, children, ...rest }: Props,
        ref: Ref<HTMLButtonElement>,
    ) => {
        return (
            <button
                // oxlint-disable-next-line react/jsx-props-no-spreading
                {...rest}
                ref={ref}
                type="button"
                className={classNames(
                    "btn d-inline-flex align-items-center gap-1",
                    variant != null && getVariantClass(variant),
                    small && "btn-sm",
                    className,
                )}
            >
                {children}
            </button>
        );
    },
);

Button.displayName = "Button";

function getVariantClass(variant: ButtonVariant): string {
    switch (variant) {
        case "primary":
            return "btn-primary";
        case "secondary":
            return "btn-secondary";
        case "success":
            return "btn-success";
        case "danger":
            return "btn-danger";
        case "warning":
            return "btn-warning";
        case "info":
            return "btn-info";
        case "light":
            return "btn-light";
        case "dark":
            return "btn-dark";

        case "link":
            return "btn-link";

        case "outline-primary":
            return "btn-outline-primary";
        case "outline-secondary":
            return "btn-outline-secondary";
        case "outline-success":
            return "btn-outline-success";
        case "outline-danger":
            return "btn-outline-danger";
        case "outline-warning":
            return "btn-outline-warning";
        case "outline-info":
            return "btn-outline-info";
        case "outline-light":
            return "btn-outline-light";
        case "outline-dark":
            return "btn-outline-dark";

        default: {
            const _ensureExhaustive: never = variant;
            throw new Error("Unknown Button variant");
        }
    }
}
