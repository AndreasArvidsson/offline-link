import type { Placement } from "@floating-ui/react";
import {
    arrow,
    autoUpdate,
    flip,
    FloatingArrow,
    FloatingFocusManager,
    FloatingPortal,
    offset,
    shift,
    useClick,
    useDismiss,
    useFloating,
    useInteractions,
    useRole,
} from "@floating-ui/react";
import type { ComponentChildren, HTMLAttributes, JSX, VNode } from "preact";
import { cloneElement } from "preact";
import { useRef, useState } from "preact/hooks";
import { classNames } from "../utils/classNames";
import "./Popover.css";

interface Parameters {
    overlay: ComponentChildren | ((hide: () => void) => ComponentChildren);
    placement?: Placement;
    className?: string;
    children: VNode<HTMLAttributes<HTMLElement>>;
}

export function Popover({
    overlay,
    placement = "top",
    className,
    children,
}: Parameters): JSX.Element {
    const [isOpen, setIsOpen] = useState(false);
    const arrowRef = useRef<SVGSVGElement | null>(null);

    const { refs, floatingStyles, context } = useFloating({
        placement,
        open: isOpen,
        onOpenChange: setIsOpen,
        whileElementsMounted: autoUpdate,
        // oxlint-disable-next-line react/refs
        middleware: [offset(10), flip(), shift(), arrow({ element: arrowRef })],
    });

    const { getReferenceProps, getFloatingProps } = useInteractions([
        useClick(context),
        useDismiss(context),
        useRole(context),
    ]);

    const { ref: _ignoredRef, ...triggerProps } = children.props;

    const triggerElement = cloneElement(children, {
        ...getReferenceProps(triggerProps),
        ref: refs.setReference,
    });

    const overlayElement = (() => {
        if (!isOpen) {
            return null;
        }

        return (
            // Without floating portal the popover gets clipped by overflow containers
            <FloatingPortal>
                <FloatingFocusManager context={context} modal={false}>
                    <div
                        ref={refs.setFloating}
                        style={floatingStyles}
                        // oxlint-disable-next-line react/jsx-props-no-spreading
                        {...getFloatingProps()}
                        className={classNames("popover", className)}
                    >
                        <FloatingArrow
                            className="popover-arrow"
                            ref={arrowRef}
                            context={context}
                            tipRadius={2}
                            fill="var(--bs-popover-bg)"
                            stroke="var(--bs-popover-border-color)"
                            strokeWidth={1}
                        />

                        {typeof overlay === "function"
                            ? overlay(() => setIsOpen(false))
                            : overlay}
                    </div>
                </FloatingFocusManager>
            </FloatingPortal>
        );
    })();

    return (
        <>
            {triggerElement}
            {overlayElement}
        </>
    );
}
