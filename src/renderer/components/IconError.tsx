import type { JSX } from "preact/jsx-runtime";
import { ExclamationCircle } from "react-bootstrap-icons";

export function IconError(): JSX.Element {
    return <ExclamationCircle className="text-danger" />;
}
