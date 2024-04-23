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
    publicError: string | null,
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

export interface IO {
    logs: Array<string>,
    warnings: Array<string>,
    errors: Array<string>,
    headers: Record<string, string>,
    cookies: Record<string, string>,
    useNext: boolean,
    nextParams: Array<string>,
    statusCode: StatusCode,
    send: Record<string, any> | string | undefined,
}

function createIO({
    builder,
    useNext,
    logs,
    error,
    payload,
}: {
    builder: ResponseBuilder,
    useNext?: boolean
    logs?: Array<string>,
    error?: string,
    payload?: Record<string, any> | string,
}): Readonly<IO> {
    const {
        headers,
        cookies,
        warnings,
        privateErrors,
        publicError,
        nextRender,
        statusCode,
    } = (builder as PrivateResponseBuilder).frozenData;

    const ioUseNext = useNext || false;
    const ioErrors = structuredClone(privateErrors)
    if(error !== undefined) {
        ioErrors.push(error);
    }

    if(publicError != null) {
        ioErrors.push(publicError);
    }

    return Object.freeze({
        logs: structuredClone(logs) || [],
        warnings: structuredClone(warnings),
        errors: ioErrors,
        headers: headers,
        cookies: cookies,
        useNext: ioUseNext,
        nextParams: [nextRender],
        statusCode: statusCode,
        send: payload,
    });
}

export async function endpointImplToIO(name: string, req: Request, impl: HandlerImpl): Promise<Readonly<IO>> {
    const builder = await impl(req, toBuilder(newData()));

    const {
        hasResponse,
        body,
        publicError,
        nextRender,
        statusCode,
        html,
    } = (builder as PrivateResponseBuilder).frozenData;
    

    if (!hasResponse) {
        return createIO({
            builder,
            logs: [`endpoint '${name}' did not return a response`],
            useNext: true,
        })
    }

    if(statusCode === undefined) {
        return createIO({
            builder,
            useNext: true,
            error: `endpoint '${name}' did not have a statusCode`,
        })
    }

    if (publicError !== null) {
        return createIO({
            builder,
            payload: {
                "error": publicError,
            }
        });
    }
    
    if (nextRender !== null) {
        return createIO({
            builder,
            useNext: true,
        });
    }
    
    if (html !== null) {
        return createIO({
            builder,
            payload: renderFrontend(html),
        });
    }
    
    return createIO({
        builder,
        payload: body
    });

}

export function endpointImplToExpressHandler(name: string, impl: HandlerImpl): RequestHandler {
    return async (req, res, next) => {
        console.log(`handling endpoint '${name}'`);

        const {
            logs,
            warnings,
            errors,
            headers,
            cookies,
            useNext,
            nextParams,
            statusCode,
            send,
        } = await endpointImplToIO(name, req, impl);

        if (logs.length !== 0) {
            console.log(logs);
        }

        if (warnings.length !== 0) {
            console.warn(warnings);
        }

        if (errors.length !== 0) {
            console.error(errors);
        }

        for (const header of Object.keys(headers)) {
            res.setHeader(header, headers[header]);
        }

        for (const cookie of Object.keys(cookies)) {
            res.cookie(cookie, cookies[cookie]);
        }

        if(useNext) {
            next(...nextParams);
            return;
        }

        res.status(statusCode);
        res.send(send);
    };
}