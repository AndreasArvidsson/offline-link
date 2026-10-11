import type { ComponentChildren, JSX, SelectHTMLAttributes } from "preact";
import { classNames } from "../utils/classNames";

const UNDEFINED_VALUE = "__SELECT_UNDEFINED__";

type SelectValue = string | number | undefined;

export interface SelectOption<T extends SelectValue> {
    value: T;
    disabled?: boolean;
    children: ComponentChildren;
}

interface Props<T extends SelectValue> extends Omit<
    SelectHTMLAttributes,
    "value" | "onChange" | "children" | "role"
> {
    className?: string;
    small?: boolean;
    invalid?: boolean;
    warning?: boolean;
    value: T;
    onChange: (value: T) => void;
    children?: readonly SelectOption<T>[];
}

export function Select<T extends SelectValue>({
    className,
    value,
    small,
    invalid,
    warning,
    onChange,
    children,
    ...rest
}: Props<T>): JSX.Element {
    return (
        <select
            // oxlint-disable-next-line react/jsx-props-no-spreading
            {...rest}
            className={classNames(
                "form-select",
                small && "form-select-sm",
                invalid && "is-invalid",
                warning && !invalid && "border-warning",
                className,
            )}
            value={value ?? UNDEFINED_VALUE}
            onChange={(e) => {
                const rawValue = e.currentTarget.value;
                const selectedOption = children?.find(
                    (child) =>
                        String(child.value ?? UNDEFINED_VALUE) === rawValue,
                );
                if (selectedOption != null) {
                    onChange(selectedOption.value);
                }
            }}
        >
            {children?.map((child) => (
                <option
                    key={child.value ?? UNDEFINED_VALUE}
                    value={child.value ?? UNDEFINED_VALUE}
                    disabled={child.disabled}
                >
                    {child.children}
                </option>
            ))}
        </select>
    );
}
