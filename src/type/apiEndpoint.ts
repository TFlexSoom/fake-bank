import { HandlerImpl } from "./response";

export interface ApiEndpoint {
    name: string,
    useAuth: boolean
    onUnauthorized?: HandlerImpl,
    routeMatcher: string,
    impl: HandlerImpl,
}
