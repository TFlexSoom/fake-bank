import { Request, RequestHandler } from "express";

import { StatusCode, statusTempRedirect } from "./status";
import { renderFrontend } from "../html/render";
import { Frontend } from "./frontend";
import { Method } from "./apiEndpoint";

export type HandlerImpl = (req: Request, res: ResponseBuilder) => Promise<ResponseBuilder>;

interface ResponseData {
    hasResponse: boolean,
    body: Record<string, any> | null,
    cookies: Record<string, string>,
    removeCookies: Array<string>,
    warnings: Array<string>,
    privateErrors: Array<string>,
    publicError: string | null,
    statusCode: StatusCode | null,
    redirectUrl: URL | undefined,
    html: Frontend | null,
}

function newData(): ResponseData {
    return Object.freeze({
        hasResponse: false,
        body: null,
        cookies: {},
        removeCookies: [],
        warnings: [],
        privateErrors: [],
        publicError: null,
        statusCode: null,
        redirectUrl: undefined,
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
    res.cookies[cookieName] = structuredClone(cookieVal);
    return res;
}

function removeCookie(res: ResponseData, cookieName: string): ResponseData {
    res.removeCookies.push(cookieName);
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

    res.redirectUrl = new URL(newLocation);
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

function render(res: ResponseData, nextPath: URL): ResponseData {
    if (!lockResponse(res, "Attempted to render response after one was sent.")) {
        return res;
    }

    res.redirectUrl = new URL(nextPath);
    return res;
}

function html(res: ResponseData, frontend: Frontend): ResponseData {
    if (!lockResponse(res, "Attempted to display html after response was sent.")) {
        return res;
    }

    res.html = frontend.clone();
    return res;
}

export interface ResponseBuilder {
    status: (statusCode: StatusCode) => ResponseBuilder,
    handle: (body?: Record<string, any>) => ResponseBuilder,
    redirect: (newLocation: URL) => ResponseBuilder,
    publicError: (error: string) => ResponseBuilder,
    cookie: (cookieName: string, cookieVal: string) => ResponseBuilder,
    removeCookie: (cookieName: string) => ResponseBuilder,
    render: (redirectUrl: URL) => ResponseBuilder,
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
        removeCookie: (cookieName: string) => toBuilder(removeCookie(structuredClone(frozenData), cookieName)),
        render: (redirectUrl: URL) => toBuilder(render(structuredClone(frozenData), redirectUrl)),
        html: (frontend: Frontend) => toBuilder(html(structuredClone(frozenData), frontend)),
    })
}

export interface IO {
    logs: Array<string>,
    warnings: Array<string>,
    errors: Array<string>,
    cookies: Record<string, string>,
    removeCookies: Array<string>
    useNext: boolean,
    redirectUrl: URL | undefined,
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
        cookies,
        removeCookies,
        warnings,
        privateErrors,
        publicError,
        redirectUrl,
        statusCode,
    } = (builder as PrivateResponseBuilder).frozenData;

    const ioUseNext = useNext || false;
    const ioErrors = structuredClone(privateErrors)
    if (error !== undefined) {
        ioErrors.push(error);
    }

    if (publicError != null) {
        ioErrors.push(publicError);
    }

    return Object.freeze({
        logs: structuredClone(logs) || [],
        warnings: structuredClone(warnings),
        errors: structuredClone(ioErrors),
        cookies: structuredClone(cookies),
        removeCookies: structuredClone(removeCookies),
        useNext: ioUseNext,
        redirectUrl: redirectUrl ? new URL(redirectUrl) : undefined,
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

    if (statusCode === undefined) {
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
            cookies,
            removeCookies,
            useNext,
            redirectUrl,
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

        for (const cookie of Object.keys(cookies)) {
            res.cookie(cookie, cookies[cookie]);
        }

        for (const remove of removeCookies) {
            res.clearCookie(remove);
        }

        if (useNext) {
            next();
            return;
        }

        if (redirectUrl !== undefined) {
            res.redirect(redirectUrl.toString());
            return;
        } else {
            // HTMX things... this is required for full page reloads/renders
            res.setHeader("HX-Redirect", req.url);
        }


        res.status(statusCode);
        res.send(send);
    };
}