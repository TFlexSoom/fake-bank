import { HandlerImpl } from "./response";

export enum Method {
    GET = "get",
    HEAD = "head",
    POST = "post",
    PUT = "put",
    PATCH = "patch",
    DELETE = "delete",
    CONNECT = "connect",
    OPTIONS = "options",
    TRACT = "trace",
    ALL = "all",
}

export interface ApiEndpoint {
    name: string,
    useAuth: boolean
    onUnauthorized?: HandlerImpl,
    routeMatcher: string,
    method: Method,
    impl: HandlerImpl,
}
