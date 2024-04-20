import { Request, RequestHandler } from "express";

import { StatusCode } from "./status";

export type HandlerImpl = (req: Request, res: ResponseBuilder) => ResponseBuilder;

interface ResponseData {
    hasResponse: boolean,
    headers: Record<string, string>,
    body: Record<string, any> | null,
    warnings: Array<string>,
    privateErrors: Array<string>,
    publicError: string,
    statusCode: StatusCode | null,
}

function newData(): ResponseData {
    return Object.freeze({
        hasResponse: false,
        headers: {},
        body: null,
        warnings: [],
        privateErrors: [],
        publicError: null,
        statusCode: null,
    });
}

function status(res: ResponseData, statusCode: StatusCode): ResponseData {
    if (res.statusCode !== null) {
        res.warnings.push("Switched Status Code");
        return res;
    }

    res.statusCode = statusCode;
    return res;
}

function handle(res: ResponseData, body?: Record<string, any>): ResponseData {
    if (res.hasResponse) {
        res.privateErrors.push("Attempted to Send Another Body after one was sent.");
        return res;
    }

    res.hasResponse = true;
    res.body = structuredClone(body);
    return res;
}

function redirect(res: ResponseData, newLocation: URL): ResponseData {
    if (res.hasResponse) {
        res.privateErrors.push("Attempted to Send another response after one was sent.");
        return res;
    }


    res.hasResponse = true;
    res.headers["Location"] = newLocation.toString();
    return res;
}

export interface ResponseBuilder {
    status: (statusCode: StatusCode) => ResponseBuilder,
    handle: (body?: Record<string, any>) => ResponseBuilder,
    redirect: (newLocation: URL) => ResponseBuilder,
};

interface PrivateResponseBuilder extends ResponseBuilder {
    frozenData: ResponseData,
}

function toBuilder(frozenData: ResponseData): PrivateResponseBuilder {
    return Object.freeze({
        frozenData,
        status: (statusCode) => toBuilder(status(structuredClone(frozenData), statusCode)),
        handle: (body?: Record<string, any>) => toBuilder(handle(structuredClone(frozenData), body)),
        redirect: (newLocation: URL) => toBuilder(redirect(structuredClone(frozenData), newLocation)),
    })
}

export function handlerImplToRequestHandler(name: string, impl: HandlerImpl): RequestHandler {
    return async (req, res, next) => {
        console.log(`handling endpoint '${name}'`);
        const builder = impl(req, toBuilder(newData()));

        const {
            hasResponse,
            headers,
            body,
            warnings,
            privateErrors,
            publicError,
            statusCode,
        } = (builder as PrivateResponseBuilder).frozenData;

        if (warnings.length !== 0) {
            console.warn("Warnings: ", warnings);
        }

        if (privateErrors.length !== 0 || publicError !== "") {
            console.error("Private Errors: ", privateErrors, "\nPublic Error: ", publicError);
        }

        if (!hasResponse) {
            console.log(`endpoint '${name}' did not return a response`);
            next();
        }

        for (const header of Object.keys(headers)) {
            res.setHeader(header, headers[header]);
        }

        res.status(statusCode).send(body);
    };
}