import { RequestHandler, Router } from "express";
import { ApiEndpoint } from "../type/apiEndpoint";
import { validateToken } from "./jwt";
import { statusUnauthorized } from "../type/status";
import { handlerImplToRequestHandler } from "../type/response";

export function cookieName(): string {
    return "auth";
}

const invalidToken: RequestHandler = async (req, res) => {
    res.status(statusUnauthorized()).json({
        error: "unauthorized"
    });
}


const validateTokenRequest: RequestHandler = async (req, res, next) => {
    const authString = req.cookies[cookieName()] || "";
    if (authString === "") {
        next();
        return;
    }

    try {
        const uuid = validateToken(authString);
        req["user"] = uuid;
        next();

    } catch (err) {
        console.warn("error validating token", err);
    }

    next();
}

export default function authentication(endpoints: Array<ApiEndpoint>): Router {
    const authRouter = Router();

    for (const endpoint of endpoints) {
        if (!endpoint.useAuth) {
            continue;
        }

        const onUnauthorized = (
            endpoint.onUnauthorized !== undefined ?
                handlerImplToRequestHandler(endpoint.name, endpoint.onUnauthorized) :
                invalidToken
        );

        authRouter.all(endpoint.routeMatcher, validateTokenRequest, onUnauthorized);
    }

    return authRouter;
}