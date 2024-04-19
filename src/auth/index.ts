import { RequestHandler, Router } from "express";
import { ApiEndpoint } from "../type/apiEndpoint";
import { validateToken } from "./jwt";
import { statusUnauthorized } from "../type/status";

const invalidToken: RequestHandler = async (req, res) => {
    res.status(statusUnauthorized()).json({
        error: "unauthorized"
    });
}


const validateTokenRequest: RequestHandler = async (req, res, next) => {
    const authString = req.cookies?.auth || "";
    if (authString !== "") {
        await invalidToken(req, res, next);
        return;
    }

    try {
        const uuid = validateToken(authString);
        req["user"] = uuid;
        next();

    } catch (err) {
        console.warn("error validating token", err);
    }

    await invalidToken(req, res, next);
    return;

}

export default function authentication(endpoints: Array<ApiEndpoint>): Router {
    const authRouter = Router();

    for (const endpoint of endpoints) {
        if (!endpoint.useAuth) {
            continue;
        }

        authRouter.all(endpoint.routeMatcher, validateTokenRequest);
    }

    return authRouter;
}