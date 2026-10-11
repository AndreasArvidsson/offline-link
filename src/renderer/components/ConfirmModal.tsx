import type { ComponentChildren, JSX } from "preact";
import { Check2Square, XSquare } from "react-bootstrap-icons";
import type { ButtonVariant } from "./Button";
import { Button } from "./Button";
import { ModalBody, ModalContent, ModalFooter, ModalHeader } from "./Modal";

interface Props {
    disabled?: boolean;
    header?: string | JSX.Element;
    resolveBtnText?: string | JSX.Element;
    resolveBtnVariant?: ButtonVariant;
    children?: ComponentChildren;
    resolve: () => void;
    reject: () => void;
}

export function ConfirmModal({
    disabled,
    header,
    resolveBtnText,
    resolveBtnVariant = "primary",
    children,
    resolve,
    reject,
}: Props): JSX.Element {
    return (
        <ModalContent className="p-2">
            {header != null && (
                <ModalHeader className="mb-2 fs-5">{header}</ModalHeader>
            )}

            {children != null && (
                <ModalBody className="mb-2">{children}</ModalBody>
            )}

            <ModalFooter className="justify-content-center">
                <Button
                    variant={resolveBtnVariant}
                    small
                    disabled={disabled}
                    onClick={resolve}
                >
                    {resolveBtnText ?? (
                        <>
                            <Check2Square /> Ok
                        </>
                    )}
                </Button>

                <Button
                    variant="secondary"
                    small
                    className="ms-3"
                    onClick={reject}
                >
                    <XSquare /> Cancel
                </Button>
            </ModalFooter>
        </ModalContent>
    );
}
