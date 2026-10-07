import type { ComponentChildren, JSX } from "preact";
import { classNames } from "../utils/classNames";

interface Props {
    active: boolean;
    onClick: () => void;
    children: ComponentChildren;
}

export function NavItem({ active, onClick, children }: Props): JSX.Element {
    return (
        <li className="nav-item">
            <a
                className={classNames("nav-link", active && "active")}
                onClick={onClick}
                href="#"
            >
                {children}
            </a>
        </li>
    );
}
