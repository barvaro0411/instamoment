import { useEffect, useRef } from "react";
import { renderFIMOToCanvas, type FilterId } from "../lib/fimoEngine";

export function FIMOCanvasPreview({
    src,
    filterId,
    timestamp,
    caption,
    seed = 1234,
    className,
    outputScale = 1,
}: {
    src: string;
    filterId: FilterId;
    timestamp?: string;
    caption?: string;
    seed?: number;
    className?: string;
    outputScale?: number;
}) {
    const ref = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!ref.current) return;
            await renderFIMOToCanvas(src, ref.current, {
                filterId,
                timestamp,
                caption,
                seed,
                outputScale,
            });
            if (cancelled) return;
        })();

        return () => {
            cancelled = true;
        };
    }, [src, filterId, timestamp, caption, seed, outputScale]);

    return (
        <canvas
            ref={ref}
            className={className}
            style={{ width: "100%", height: "auto", display: "block" }}
        />
    );
}
