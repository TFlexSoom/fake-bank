import express from "express";
import cookieParser from "cookie-parser";
import authentication from "./auth";
import { ApiEndpoint } from "./type/apiEndpoint";
import Endpoints from "./endpoints";

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

    const _endpoints: Array<ApiEndpoint> = Endpoints;

    instance.use(cookieParser());
    instance.use(authentication(_endpoints));
    instance.use(express.json());

    return Object.freeze({
        run: () => instance.listen(port),
    });
}