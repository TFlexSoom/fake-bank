import { Request, RequestHandler } from "express";

import { StatusCode, statusTempRedirect } from "./status";
import { Frontend, renderFrontend } from "../html/render";

export type HandlerImpl = (req: Request, res: ResponseBuilder) => Promise<ResponseBuilder>;

interface ResponseData {
    hasResponse: boolean,
    headers: Record<string, string>,
    body: Record<string, any> | null,
    cookies: Record<string, string>,
    warnings: Array<string>,
    privateErrors: Array<string>,
    publicError: string,
    statusCode: StatusCode | null,
    nextRender: string | null,
    html: Frontend | null,
}

function newData(): ResponseData {
    return Object.freeze({
        hasResponse: false,
        headers: {},
        body: null,
        cookies: {},
        warnings: [],
        privateErrors: [],
        publicError: null,
        statusCode: null,
        nextRender: null,
        html: null,
    });
}

function lockResponse(res: ResponseData, error: string): boolean {
    if (res.hasResponse) {
        res.privateErrors.push(error);
        return false;
    }

    res.hasResponse = true;
    return true;
}

function status(res: ResponseData, statusCode: StatusCode): ResponseData {
    if (res.statusCode !== null) {
        res.warnings.push("Switched Status Code");
        return res;
    }

    res.statusCode = statusCode;
    return res;
}

function cookie(res: ResponseData, cookieName: string, cookieVal: any): ResponseData {
    res.cookies[cookieName] = JSON.stringify(cookieVal);
    return res;
}

function handle(res: ResponseData, body?: Record<string, any>): ResponseData {
    if (!lockResponse(res, "Attempted to Send Another Body after one was sent.")) {
        return res;
    }
    res.body = structuredClone(body);
    return res;
}

function redirect(res: ResponseData, newLocation: URL): ResponseData {
    if (!lockResponse(res, "Attempted to Send another response after one was sent.")) {
        return res;
    }

    res.headers["Location"] = newLocation.toString();
    res.statusCode = statusTempRedirect();
    return res;
}

function publicError(res: ResponseData, error: string): ResponseData {
    if (!lockResponse(res, "Attempted to Error response after one was sent.")) {
        return res;
    }

    res.publicError = structuredClone(error);
    return res;
}

function render(res: ResponseData, nextPath: string): ResponseData {
    if (!lockResponse(res, "Attempted to render response after one was sent.")) {
        return res;
    }

    res.nextRender = structuredClone(nextPath);
    return res;
}

function html(res: ResponseData, frontend: Frontend): ResponseData {
    if (!lockResponse(res, "Attempted to display html after response was sent.")) {
        return res;
    }

    res.html = structuredClone(frontend);
    return res;
}

export interface ResponseBuilder {
    status: (statusCode: StatusCode) => ResponseBuilder,
    handle: (body?: Record<string, any>) => ResponseBuilder,
    redirect: (newLocation: URL) => ResponseBuilder,
    publicError: (error: string) => ResponseBuilder,
    cookie: (cookieName: string, cookieVal: string) => ResponseBuilder,
    render: (shortPath: string) => ResponseBuilder,
    html: (frontend: Frontend) => ResponseBuilder,
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
        publicError: (error: string) => toBuilder(publicError(structuredClone(frozenData), error)),
        cookie: (cookieName: string, cookieVal: string) => toBuilder(cookie(structuredClone(frozenData), cookieName, cookieVal)),
        render: (nextPath: string) => toBuilder(render(structuredClone(frozenData), nextPath)),
        html: (frontend: Frontend) => toBuilder(html(structuredClone(frozenData), frontend)),
    })
}

export function handlerImplToRequestHandler(name: string, impl: HandlerImpl): RequestHandler {
    return async (req, res, next) => {
        console.log(`handling endpoint '${name}'`);
        const builder = await impl(req, toBuilder(newData()));

        const {
            hasResponse,
            headers,
            body,
            warnings,
            privateErrors,
            publicError,
            nextRender,
            statusCode,
            html,
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

        res.status(statusCode);
        if (publicError !== "") {
            res.send({
                "error": publicError,
            });
        } else if (nextRender !== null) {
            next(nextRender);
        } else if (html !== null) {
            res.send(renderFrontend(html));
        } else {
            res.send(body);
        }
    };
}