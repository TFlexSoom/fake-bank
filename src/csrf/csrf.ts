import { RequestHandler, Router } from "express";
import { ApiEndpoint } from "../type/apiEndpoint";
import { generateToken, validateToken } from "./token";
import { cookieName as authCookieName } from "../auth";
import { getOrCreateSession } from "../data/session";
import { statusNotFound } from "../type/status";
import { Uuid } from "../type/uuid";
import { nonceFieldName } from "../type/frontend";

export function cookieName(): string {
    return "session";
}

export function headerName(): string {
    return "X-CSRF-TOKEN";
}

export function fieldName(): string {
    return "nonce";
}

const invalidToken: RequestHandler = async (req, res) => {
    console.log(`Bad Token Used by ${req.ip}`);
    res.clearCookie(cookieName());
    res.clearCookie(authCookieName());
    res.status(statusNotFound()).redirect(new URL(req.protocol + "://" + req.get("host") + "/login").toString());
}

const sessionize: RequestHandler = async (req, res, next) => {
    const sessionUuidStr: string = req.cookies[cookieName()];
    const sessionUuid = Uuid.validateString(sessionUuidStr) ?
        Uuid.fromString(sessionUuidStr) : undefined;

    const session = await getOrCreateSession(sessionUuid);

    if (sessionUuid === undefined || !sessionUuid.equal(session.uuid)) {
        res.cookie(cookieName(), session.uuid.toString());
    }

    req[nonceFieldName()] = await generateToken(session.csrfRandom);
    next()
}

const validateTokenRequest: RequestHandler = async (req, res, next) => {
    if (req.method === "GET") {
        next();
        return;
    }

    try {
        const sessionUuid = Uuid.fromString(req.cookies[cookieName()]);
        const body = req?.body || {};
        const nonce = req.header(headerName()) || body[fieldName()] || "";
        const session = await getOrCreateSession(sessionUuid);
        const csrfRandom = session?.csrfRandom || "";

        if (!(await validateToken(nonce, csrfRandom))) {
            invalidToken(req, res, next);
            return;
        }

        next();
        return;

    } catch (err) {
        console.warn("error validating token", err);
    }

    invalidToken(req, res, next);
};

export default function csrf(endpoints: Array<ApiEndpoint>): Router {
    const csrfRouter = Router();

    for (const endpoint of endpoints) {
        csrfRouter.all(endpoint.routeMatcher, sessionize);

        if (!endpoint.useCsrf) {
            continue;
        }

        csrfRouter.all(endpoint.routeMatcher, validateTokenRequest);
    }

    return csrfRouter;
}