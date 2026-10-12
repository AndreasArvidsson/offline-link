import type {
    FunctionalComponent,
    InputHTMLAttributes,
    JSX,
    Ref,
    TargetedEvent,
} from "preact";
import { forwardRef } from "preact/compat";
import { classNames } from "../utils/classNames";

export type InputTextProps = Omit<
    InputHTMLAttributes,
    "type" | "onChange" | "role"
> & {
    value?: string;
    className?: string;
    small?: boolean;
    invalid?: boolean;
    warning?: boolean;
} & (
        | {
              onChange?: (value: string) => void;
              onChangeOpt?: never;
          }
        | {
              onChange?: never;
              // onChangeOpt is an alternative to onChange that allows the value to be undefined if the input is empty or only whitespace.
              onChangeOpt?: (value: string | undefined) => void;
          }
    );

// Preserve the props union, which forwardRef's return type would flatten.
export const InputText: FunctionalComponent<InputTextProps> = forwardRef(
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
