import type { JSX } from "preact";
import { ExclamationCircle } from "react-bootstrap-icons";

export function IconError(): JSX.Element {
    return <ExclamationCircle className="text-danger" />;
}
