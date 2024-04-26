import { ApiEndpoint, Method } from "../../type/apiEndpoint";
import { dashboard } from "./dashboard";
import { details, newAccount } from "./details";
import { loan, loanPage } from "./loan";
import { loginGet, loginPost, logout } from "./login";
import { registerGet, registerPost } from "./register";
import { transfer, transferPage } from "./transfer";

const rootRedirect: ApiEndpoint = {
    name: "root",
    method: Method.GET,
    useAuth: true,
    useCsrf: false,
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
    newAccount,
    transfer,
    transferPage,
    loan,
    loanPage,
]