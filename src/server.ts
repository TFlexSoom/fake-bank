import express from "express";
import cookieParser from "cookie-parser";
import authentication from "./auth";
import { ApiEndpoint } from "./type/apiEndpoint";
import Endpoints from "./endpoints";
import { endpointImplToExpressHandler } from "./type/response";
import { statusNotFound } from "./type/status";
import "dotenv/config";

export interface Server {
    run: () => void
}

function portFromArg(arg: string | undefined): number | undefined {
    if (arg === undefined) {
        return undefined
    }

    const port: number = Number.parseInt(arg);
    if (port > 65535) {
        throw new Error("cannot use out of range port");
    }

    return port;
}

export function create(args: Array<string>): Server {
    const [portArg] = args;
    const port = portFromArg(portArg) || 8080;
    const instance = express();

    const _endpoints: Array<ApiEndpoint> = Endpoints;

    instance.use(cookieParser());
    instance.use(authentication(_endpoints));
    instance.use(express.json());
    for (const endpoint of _endpoints) {
        instance[endpoint.method](
            endpoint.routeMatcher,
            endpointImplToExpressHandler(endpoint.name, endpoint.impl),
        );
    }

    // Change to 404
    instance.use((req, res, next) => {
        res.status(statusNotFound()).send({
            error: "Missing Page 404",
        });
    });

    return Object.freeze({
        run: () => instance.listen(port),
    });
}