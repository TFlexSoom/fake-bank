import { RequestHandler, Router } from "express";
import { ApiEndpoint } from "../type/apiEndpoint";

const validateTokenRequest: RequestHandler = async (req, res, next) => {
    const authString = req.headers.authorization;
    
}

export default function authentication(handlers: Array<ApiEndpoint>): Router {
    const authRouter = Router();

    for (const handler of handlers) {
        if(! handler.useAuth) {
            continue;
        }

        authRouter.all(handler.routeMatcher, validateTokenRequest);
    }

    return authRouter;
}