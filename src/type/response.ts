import { StatusCode } from "./status";

interface ResponseState {
    hasResponse: boolean,
    body: Record<string, any> | null,
    warnings: Array<string>,
    privateErrors: Array<string>,
    publicError: string,
    statusCode: StatusCode | null,
}


export interface ResponseMonad {
    status: (statusCode: StatusCode) => ResponseMonad,
    handle: (body: Record<string, any>) => ResponseMonad,
};

function status(res: ResponseState, monadRef: ResponseMonad, statusCode: StatusCode): ResponseMonad {
    if (res.statusCode !== null) {
        res.warnings.push("Switched Status Code");
    }

    res.statusCode = statusCode;
    return monadRef;
}

function handle(res: ResponseState, monadRef: ResponseMonad, body?: Record<string, any>): ResponseMonad {
    if (res.hasResponse) {
        res.privateErrors.push("Attempted to Send Another Body after one was sent.");
        return monadRef;
    }

    res.body = structuredClone(body);
    return monadRef;
}

export function createMonad(): ResponseMonad {
    const state: ResponseState = Object.seal({
        hasResponse: false,
        body: null,
        warnings: [],
        privateErrors: [],
        publicError: null,
        statusCode: null,
    });

    return Object.freeze({
        status: status.bind(null, state),
        handle: handle.bind(null, state),
    });
}