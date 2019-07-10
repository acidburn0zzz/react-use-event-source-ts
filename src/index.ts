import { useEffect, useRef, useState } from "react";
import { Action, Store } from "redux";
import { useStore } from "react-redux";

type EventSourceConstructor = { new(url: string, eventSourceInitDict?: EventSourceInit): EventSource; };

export type EventSourceStatus = "init" | "open" | "closed" | "error";

export type EventSourceEvent = Event & { data: string };

export function useEventSource(url: string, withCredentials?: boolean, ESClass: EventSourceConstructor = EventSource) {
    const source = useRef<EventSource | null>(null);
    const [status, setStatus] = useState<EventSourceStatus>("init");
    useEffect(() => {
        if(url) {
            const es = source.current = new ESClass(url, { withCredentials });

            es.addEventListener("open", () => setStatus("open"));
            es.addEventListener("error", () => setStatus("error"));

            return () => {
                source.current = null;
                es.close();
            };
        } else {
            setStatus("closed");
        }
        return undefined;
    }, [url, withCredentials, ESClass]);

    return [source.current, status] as const;
}

export function useEventSourceListener(source: EventSource | null, types: string[], listener: (e: EventSourceEvent) => void, dependencies: any[] = []) {
    useEffect(() => {
        if(source) {
            types.forEach(type => source.addEventListener(type, listener as any));
            return () => types.forEach(type => source.removeEventListener(type, listener as any));
        }
        return undefined;
    }, [source, ...dependencies]);
}

export function useEventSourceListenerRedux<S, A extends Action>(source: EventSource | null, types: string[], listener: (store: Store<S, A>, e: EventSourceEvent) => void, dependencies: any[] = []) {
    const store = useStore<S, A>();
    useEventSourceListener(source, types, e => listener(store, e), dependencies);
}
