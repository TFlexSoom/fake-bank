import { ApiEndpoint, Method } from "../../type/apiEndpoint";
import { dashboard } from "./dashboard";
import { details } from "./details";
import { loginGet, loginPost, logout } from "./login";
import { registerGet, registerPost } from "./register";

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
        return res.redirect(new URL(req.protocol + "://" + req.get("host") + "/dashboard"));
    },
}

export const Endpoints = [
    rootRedirect,
    loginGet,
    loginPost,
    logout,
    registerGet,
    registerPost,
    dashboard,
    details,
]