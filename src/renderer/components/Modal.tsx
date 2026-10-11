// oxlint-disable react/jsx-props-no-spreading
import type { ComponentChildren, HTMLAttributes, JSX } from "preact";
import { classNames } from "../utils/classNames";

interface Props extends HTMLAttributes<HTMLDivElement> {
    className?: string;
    children?: ComponentChildren;
}

export function ModalContent({
    className,
    children,
    ...rest
}: Props): JSX.Element {
    return (
        <div {...rest} className={classNames("modal-content", className)}>
            {children}
        </div>
    );
}

export function ModalHeader({
    className,
    children,
    ...rest
}: Props): JSX.Element {
    return (
        <div {...rest} className={classNames("modal-header", className)}>
            {children}
        </div>
    );
}

export function ModalBody({
    className,
    children,
    ...rest
}: Props): JSX.Element {
    return (
        <div {...rest} className={classNames("modal-body", className)}>
            {children}
        </div>
    );
}

export function ModalFooter({
    className,
    children,
    ...rest
}: Props): JSX.Element {
    return (
        <div {...rest} className={classNames("modal-footer", className)}>
            {children}
        </div>
    );
}
