import type { ComponentChildren, JSX, SelectHTMLAttributes } from "preact";
import { classNames } from "../classNames";

const UNDEFINED_VALUE = "__SELECT_UNDEFINED__";

type SelectValue = string | undefined;

export interface SelectOption<T extends SelectValue> {
    value: T;
    children: ComponentChildren;
}

interface BaseProps<T extends SelectValue> extends Omit<
    SelectHTMLAttributes,
    "value" | "onChange" | "children" | "role"
> {
    className?: string;
    small?: boolean;
    invalid?: boolean;
    warning?: boolean;
    children?: readonly (SelectOption<T> | false)[];
}

interface DefinedProps<T extends string> extends BaseProps<T> {
    value: T;
    onChange: (value: T) => void;
}

interface OptionalProps<T extends string> extends BaseProps<T | undefined> {
    value?: T | undefined;
    onChange: (value: T | undefined) => void;
}

type Props<T extends string> = DefinedProps<T> | OptionalProps<T>;

export function Select<T extends string>(props: DefinedProps<T>): JSX.Element;
// The overloads preserve contextual typing for JSX onChange callbacks.
// oxlint-disable-next-line typescript-eslint/unified-signatures
export function Select<T extends string>(props: OptionalProps<T>): JSX.Element;
export function Select<T extends string>({
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
                const selectedValue =
                    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
                    rawValue === UNDEFINED_VALUE ? undefined : (rawValue as T);
                // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
                (onChange as (value: T | undefined) => void)(selectedValue);
            }}
        >
            {children?.map((child) => {
                if (child === false) {
                    return false;
                }
                return (
                    <option
                        key={child.value ?? UNDEFINED_VALUE}
                        value={child.value ?? UNDEFINED_VALUE}
                    >
                        {child.children}
                    </option>
                );
            })}
        </select>
    );
}
