import { RequestHandler, Router } from "express";
import { ApiEndpoint } from "../type/apiEndpoint";
import { validateToken } from "./jwt";
import { statusUnauthorized } from "../type/status";
import { endpointImplToExpressHandler } from "../type/response";

export function cookieName(): string {
    return "auth";
}

const invalidToken: RequestHandler = async (req, res) => {
    return res.status(statusUnauthorized()).json({
        error: "unauthorized"
    });
}

function validateTokenRequest(onUnauthorizedEndpoint: ApiEndpoint): RequestHandler {
    const onUnauthorized: RequestHandler = (
        onUnauthorizedEndpoint.onUnauthorized !== undefined ?
            endpointImplToExpressHandler(onUnauthorizedEndpoint.name, onUnauthorizedEndpoint.onUnauthorized) :
            invalidToken
    );

    return async (req, res, next) => {
        const authString = req.cookies[cookieName()] || "";
        if (authString === "") {
            onUnauthorized(req, res, next);
            return;
        }

        try {
            const uuid = await validateToken(authString);
            if (uuid === undefined) {
                onUnauthorized(req, res, next);
                return;
            }

            req["user"] = uuid;
            next();
            return;

        } catch (err) {
            console.warn("error validating token", err);
        }

        onUnauthorized(req, res, next);
    };
}

export default function authentication(endpoints: Array<ApiEndpoint>): Router {
    const authRouter = Router();

    for (const endpoint of endpoints) {
        if (!endpoint.useAuth) {
            continue;
        }

        authRouter.all(endpoint.routeMatcher, validateTokenRequest(endpoint));
    }

    return authRouter;
}