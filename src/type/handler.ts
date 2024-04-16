import { Request } from "express";

import { ResponseMonad } from "./response";

export interface Handler {
    useAuth: boolean
    routeMatcher: string,
    impl: (req: Request, res: ResponseMonad) => ResponseMonad,
}

