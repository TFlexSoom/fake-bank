import express from "express";

export interface Server {
    run: () => void
}

function portFromArg(arg: string | undefined): number | undefined {
    if (arg === undefined) {
        return undefined
    }

    const port: number = Number.parseInt(arg);
    if (port > 65535) {
        throw new Error("Cannot use Out of range port");
    }

    return port;
}

export function create(): Server {
    const port = portFromArg(process.argv[0]) || 8080;
    const instance = express();

    instance.use(authentication());
    instance.use(express.json());

    return Object.freeze({
        run: () => instance.listen(port),
    });
}