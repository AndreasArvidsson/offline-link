import type { InputHTMLAttributes, JSX, Ref, TargetedEvent } from "preact";
import { forwardRef } from "preact/compat";
import { classNames } from "../classNames";

export interface InputTextProps extends Omit<
    InputHTMLAttributes,
    "type" | "onChange" | "role"
> {
    value?: string;
    className?: string;
    small?: boolean;
    invalid?: boolean;
    warning?: boolean;
    onChange?: (value: string) => void;
    // onChangeOpt is an alternative to onChange that allows the value to be undefined if the input is empty or only whitespace.
    onChangeOpt?: (value: string | undefined) => void;
}

export const InputText = forwardRef(
    // oxlint-disable-next-line react/function-component-definition
    (
        {
            value,
            className,
            small,
            invalid,
            warning,
            onChange,
            onChangeOpt,
            ...rest
        }: InputTextProps,
        ref: Ref<HTMLInputElement>,
    ): JSX.Element => {
        return (
            <input
                // oxlint-disable-next-line react/jsx-props-no-spreading
                {...rest}
                ref={ref}
                type="text"
                className={classNames(
                    "form-control",
                    small && "form-control-sm",
                    invalid && "is-invalid",
                    warning && !invalid && "is-invalid is-invalid-warning",
                    className,
                )}
                value={value ?? ""}
                onChange={getOnChange(onChange, onChangeOpt)}
            />
        );
    },
);

InputText.displayName = "InputText";

function getOnChange(
    onChange?: (value: string) => void,
    onChangeOpt?: (value: string | undefined) => void,
) {
    if (onChange != null) {
        if (onChangeOpt != null) {
            throw new Error(
                `InputText: Cannot specify both onChange and onChangeOpt`,
            );
        }

        return (e: TargetedEvent<HTMLInputElement>) => {
            onChange(e.currentTarget.value);
        };
    }

    if (onChangeOpt != null) {
        return (e: TargetedEvent<HTMLInputElement>) => {
            onChangeOpt(
                e.currentTarget.value.trim() === ""
                    ? undefined
                    : e.currentTarget.value,
            );
        };
    }

    return undefined;
}
