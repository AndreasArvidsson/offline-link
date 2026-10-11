import type { JSX, TargetedFocusEvent } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import type { InputTextProps } from "./InputText";
import { InputText } from "./InputText";

interface Props extends Omit<
    InputTextProps,
    "value" | "onChange" | "onChangeOpt"
> {
    isInteger?: boolean;
    value?: number;
    onChange?: (value: number | undefined) => void;
    formatValue?: (value: number) => string;
}

export function InputNumber({
    isInteger,
    value,
    onChange,
    onBlur,
    formatValue,
    ...rest
}: Props): JSX.Element {
    const [currentText, setCurrentText] = useState(value?.toString());
    const inputRef = useRef<HTMLInputElement>(null);

    const updateCurrentText = (val: number | undefined) => {
        if (val != null && formatValue != null) {
            setCurrentText(formatValue(val));
        } else {
            setCurrentText(val?.toString());
        }
    };

    useEffect(() => {
        updateCurrentText(value);
    }, [value]);

    const commitValue = (newValue: number | undefined) => {
        if (newValue !== value) {
            onChange?.(newValue);
        }
    };

    const onInputChange = (inputValue: string) => {
        const newText = sanitizeInputValue(isInteger, inputValue);

        // The component will not re render if the text is the same, but we
        // still want to update the input field if the sanitized text differs
        // from the current text.
        if (inputValue !== newText && inputRef.current != null) {
            inputRef.current.value = newText;
        }

        // If the text is empty, clear the value and notify parent
        if (newText === "") {
            updateCurrentText(undefined);
            commitValue(undefined);
            return;
        }

        // If the text is not a parseable number, just update the text without changing the value
        const newValue = parseInputValue(newText);

        if (newValue != null) {
            updateCurrentText(newValue);
            commitValue(newValue);
        } else {
            setCurrentText(newText);
        }
    };

    const myOnBlur = (e: TargetedFocusEvent<HTMLInputElement>) => {
        const parsedValue =
            currentText == null ? undefined : parseInputValue(currentText);

        if (parsedValue == null) {
            updateCurrentText(value);
            onBlur?.(e);
            return;
        }

        updateCurrentText(parsedValue);
        commitValue(parsedValue);
        onBlur?.(e);
    };

    return (
        <InputText
            // oxlint-disable-next-line react/jsx-props-no-spreading
            {...rest}
            ref={inputRef}
            value={currentText}
            onChange={onInputChange}
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

function parseInputValue(inputValue: string): number | undefined {
    if (inputValue === "") {
        return undefined;
    }
    const num = Number(inputValue);
    return Number.isNaN(num) ? undefined : num;
}
