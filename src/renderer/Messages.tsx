import type { ComponentChildren, JSX } from "preact";
import { createContext } from "preact";
import {
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from "preact/hooks";
import { Alert } from "./components/Alert";

type MessageType = "info" | "warning" | "error";

export interface Message {
    id: number;
    message: string;
    type: MessageType;
    // Time to live in ms
    ttl?: number;
}

export interface ErrorMessage {
    message: string;
    cause?: unknown;
}

interface Props {
    children: ComponentChildren;
}

interface UseMessagesContextValue {
    addInfo: (message: string) => void;
    addWarning: (message: string) => void;
    addError: (message: unknown) => void;
}

interface MessagesStateContextValue {
    messages: Message[];
    removeMessage: (error: Message) => void;
}

const UseMessagesContext = createContext<UseMessagesContextValue | undefined>(
    undefined,
);

const MessagesStateContext = createContext<
    MessagesStateContextValue | undefined
>(undefined);

UseMessagesContext.displayName = "UseMessagesContext";
MessagesStateContext.displayName = "MessagesStateContext";

export function MessageProvider({ children }: Props): JSX.Element {
    const [messages, setMessages] = useState<Message[]>([]);
    const nextIdRef = useRef(1);

    const removeMessage = useCallback((message: Message) => {
        setMessages((prev) => prev.filter((m) => m.id !== message.id));
    }, []);

    const addMessage = useCallback(
        (message: Omit<Message, "id">) => {
            const newMessage: Message = { id: nextIdRef.current++, ...message };
            setMessages((prev) => [...prev, newMessage]);
            if (message.ttl != null) {
                setTimeout(() => removeMessage(newMessage), message.ttl);
            }
        },
        [removeMessage],
    );

    const addInfo = useCallback(
        (message: string) => {
            addMessage({ message, type: "info", ttl: 10_000 });
        },
        [addMessage],
    );

    const addWarning = useCallback(
        (message: string) => {
            addMessage({ message, type: "warning" });
        },
        [addMessage],
    );

    const addError = useCallback(
        (message: unknown) => {
            const e = getErrorMessage(message);
            if (e.cause != null) {
                console.error(e.message, e.cause);
            } else {
                console.error(e.message);
            }
            addMessage({ message: e.message, type: "error" });
        },
        [addMessage],
    );

    const useMessagesValue = useMemo<UseMessagesContextValue>(() => {
        return { addInfo, addWarning, addError };
    }, [addInfo, addWarning, addError]);

    const messagesStateValue = useMemo<MessagesStateContextValue>(() => {
        return { messages, removeMessage };
    }, [messages, removeMessage]);

    return (
        <UseMessagesContext.Provider value={useMessagesValue}>
            <MessagesStateContext.Provider value={messagesStateValue}>
                {children}
            </MessagesStateContext.Provider>
        </UseMessagesContext.Provider>
    );
}

export function Messages(): JSX.Element | null {
    const ctx = useContext(MessagesStateContext);

    if (ctx == null) {
        throw new Error("Messages must be used within a MessageProvider");
    }

    if (ctx.messages.length === 0) {
        return null;
    }

    return (
        <div className="messages sticky-top">
            {ctx.messages.map((msg) => {
                return (
                    <Alert
                        key={msg.id}
                        variant={getAlertVariant(msg.type)}
                        onClose={() => ctx.removeMessage(msg)}
                    >
                        {msg.message}
                    </Alert>
                );
            })}
        </div>
    );
}

export function useMessages(): UseMessagesContextValue {
    const ctx = useContext(UseMessagesContext);
    if (ctx == null) {
        throw new Error("useMessages must be used within a MessageProvider");
    }
    return ctx;
}

function getAlertVariant(type: MessageType): "info" | "warning" | "danger" {
    switch (type) {
        case "info":
            return "info";
        case "warning":
            return "warning";
        case "error":
            return "danger";
        default: {
            const _ensureExhaustive: never = type;
            throw new Error("Unknown message type");
        }
    }
}

function getErrorMessage(error: unknown): ErrorMessage {
    if (typeof error === "string") {
        return { message: error };
    }

    if (error instanceof Error) {
        return { message: error.message, cause: error };
    }

    if (isErrorMessage(error)) {
        return error;
    }

    return {
        message: "Unknown error",
        cause: error,
    };
}

function isErrorMessage(value: unknown): value is ErrorMessage {
    if (typeof value !== "object" || value == null) {
        return false;
    }
    return "message" in value && typeof value.message === "string";
}
