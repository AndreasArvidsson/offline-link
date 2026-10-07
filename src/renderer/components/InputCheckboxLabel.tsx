import type { ComponentChildren, JSX } from "preact";
import { classNames } from "../utils/classNames";
import { InputCheckbox } from "./InputCheckbox";

interface Props {
    className?: string;
    title?: string;
    checked?: boolean;
    inline?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    children: ComponentChildren;
    onChange?: (checked: boolean) => void;
}

export function InputCheckboxLabel({
    className,
    checked,
    title,
    inline,
    disabled,
    invalid,
    children,
    onChange,
}: Props): JSX.Element {
    return (
        <div
            className={classNames(
                "form-check",
                inline && "form-check-inline",
                className,
            )}
        >
            <label className="form-check-label" title={title}>
                <InputCheckbox
                    checked={checked}
                    disabled={disabled}
                    invalid={invalid}
                    onChange={onChange}
                />
                {children}
            </label>
        </div>
    );
}
