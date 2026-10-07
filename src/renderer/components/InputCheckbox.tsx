import type { InputHTMLAttributes, JSX } from "preact";
import { classNames } from "../utils/classNames";

export interface InputCheckboxProps extends Omit<
    InputHTMLAttributes,
    "type" | "onChange" | "role"
> {
    className?: string;
    invalid?: boolean;
    onChange?: (checked: boolean) => void;
}

export function InputCheckbox({
    className,
    invalid,
    onChange,
    ...rest
}: InputCheckboxProps): JSX.Element {
    return (
        <input
            // oxlint-disable-next-line react/jsx-props-no-spreading
            {...rest}
            type="checkbox"
            className={classNames(
                "form-check-input",
                invalid && "is-invalid",
                className,
            )}
            onChange={
                onChange ? (e) => onChange(e.currentTarget.checked) : undefined
            }
        />
    );
}
