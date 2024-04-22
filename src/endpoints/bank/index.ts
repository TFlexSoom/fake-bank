import { ApiEndpoint, Method } from "../../type/apiEndpoint";
import { loginGet, loginPost } from "./login";

const rootRedirect: ApiEndpoint = {
    name: "root",
    method: Method.GET,
    useAuth: true,
    onUnauthorized:
        async (req, res) => {
            return res.redirect(new URL(req.protocol + "://" + req.get("host") + "/login"));
        },
    routeMatcher: "/",
    impl: async (req, res) => {
        return res.redirect(new URL(req.protocol + "://" + req.get("host") + "/login"));
    },
}

export const Endpoints = [
    rootRedirect,
    loginGet,
    loginPost,
]