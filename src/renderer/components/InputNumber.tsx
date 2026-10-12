import type { JSX, TargetedFocusEvent } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import type { InputTextProps } from "./InputText";
import { InputText } from "./InputText";

type Props = Omit<
    InputTextProps,
    "value" | "onChange" | "onChangeOpt" | "min" | "max"
> & {
    isInteger?: boolean;
    invalid?: boolean;
    value?: number;
    min?: number;
    max?: number;
    formatValue?: (value: number) => string;
} & (
        | {
              onChange?: (value: number) => void;
              onChangeOpt?: never;
          }
        | {
              onChange?: never;
              // onChangeOpt is an alternative to onChange that allows the value to be undefined if the input is empty or only whitespace.
              onChangeOpt?: (value: number | undefined) => void;
          }
    );

export function InputNumber({
    isInteger,
    invalid = false,
    value,
    min,
    max,
    onChange,
    onChangeOpt,
    onBlur,
    formatValue,
    ...rest
}: Props): JSX.Element {
    const [currentText, setCurrentText] = useState("");
    const [isValid, setIsValid] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);

    const updateCurrentText = (newText: string) => {
        // Keep the input synchronized even when the state value is unchanged.
        if (
            inputRef.current != null &&
            inputRef.current.value !== newText &&
            currentText === newText
        ) {
            inputRef.current.value = newText;
        }

        setCurrentText(newText);
    };

    const updateCurrentTextValue = (val: number | undefined) => {
        updateCurrentText(
            val != null && formatValue != null
                ? formatValue(val)
                : (val?.toString() ?? ""),
        );
    };

    useEffect(() => {
        updateCurrentTextValue(value);
    }, [value]);

    const commitValue = (newValue: number | undefined) => {
        if (newValue !== value) {
            if (newValue != null) {
                onChange?.(newValue);
            }
            onChangeOpt?.(newValue);
        }
    };

    const myOnChange = (inputValue: string) => {
        const sanitizedInput = sanitizeInputValue(isInteger, inputValue);

        updateCurrentText(sanitizedInput);

        // If the text is empty, clear the value and notify the parent
        if (sanitizedInput === "") {
            // Empty input is only valid if onChangeOpt is provided
            const valid = onChangeOpt != null;
            setIsValid(valid);
            if (valid) {
                commitValue(undefined);
            }
            return;
        }

        const inputNumber = parseNumber(sanitizedInput);

        // If the text is not a parseable number, just update the text without notifying the parent
        if (inputNumber == null) {
            setIsValid(false);
        } else {
            const valid =
                (min == null || inputNumber >= min) &&
                (max == null || inputNumber <= max);
            setIsValid(valid);
            if (valid) {
                commitValue(inputNumber);
            }
        }
    };

    const myOnBlur = (e: TargetedFocusEvent<HTMLInputElement>) => {
        const inputNumber = parseNumber(currentText);

        if (inputNumber == null || !isValid) {
            updateCurrentTextValue(value);
            setIsValid(true);
            onBlur?.(e);
            return;
        }

        updateCurrentTextValue(inputNumber);
        setIsValid(true);
        commitValue(inputNumber);
        onBlur?.(e);
    };

    return (
        <InputText
            // oxlint-disable-next-line react/jsx-props-no-spreading
            {...rest}
            ref={inputRef}
            value={currentText}
            invalid={invalid || !isValid}
            onChange={myOnChange}
            onBlur={myOnBlur}
        />
    );
}

function sanitizeInputValue(
    isInteger: boolean | undefined,
    inputValue: string,
): string {
    let result = "";
    let allowDot = !isInteger;

    for (const char of inputValue.trim()) {
        if (char >= "0" && char <= "9") {
            result += char;
        } else if (char === "-" && result === "") {
            result += char;
        } else if (char === "." && allowDot) {
            result += char;
            allowDot = false;
        }
    }

    return result;
}

function parseNumber(inputValue: string): number | undefined {
    if (inputValue === "") {
        return undefined;
    }
    const num = Number(inputValue);
    return Number.isFinite(num) ? num : undefined;
}
