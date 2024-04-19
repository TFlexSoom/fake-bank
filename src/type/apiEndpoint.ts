import { Request } from "express";

import { ResponseMonad } from "./response";

export interface ApiEndpoint {
    useAuth: boolean
    routeMatcher: string,
    impl: (req: Request, res: ResponseMonad) => ResponseMonad,
}

