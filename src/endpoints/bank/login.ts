import { cookieName } from "../../auth";
import { generateToken } from "../../auth/jwt";
import { validatePassword } from "../../auth/password";
import { isValidUsername } from "../../auth/username";
import { lockLoginRequest } from "../../data/ratelimit";
import { getEmptyUser, getUserFromUsername } from "../../data/user";
import { usernamePasswordModal } from "../../html/modal";
import { frontendWithTitle } from "../../html/render";
import { ApiEndpoint, Method } from "../../type/apiEndpoint";
import { statusBadRequest, statusOk, statusUnauthorized } from "../../type/status";

interface LoginPayload {
    username?: string,
    password?: string,
}

export const loginPost: ApiEndpoint = {
    name: "login",
    method: Method.POST,
    useAuth: false,
    useCsrf: true,
    routeMatcher: "/login",
    impl: async (req, res) => {
        if (! await lockLoginRequest(req.ip)) {
            return res.status(statusBadRequest()).publicError("Limit Reached!");
        }

        const { username, password } = req.body as LoginPayload;
        if (!isValidUsername(username)) {
            return res.status(statusBadRequest()).publicError("Bad Username Supplied!");
        }

        const user = (await getUserFromUsername(username)) || getEmptyUser();
        const isValid = await validatePassword(user, password || "");
        if (!isValid) {
            return res.status(statusUnauthorized()).publicError("Unauthorized");
        }

        res = res.cookie(cookieName(), await generateToken(user.uuid));
        return res.render(new URL(req.protocol + "://" + req.get("host") + "/dashboard"));
    },
}

export const loginGet: ApiEndpoint = {
    name: "loginPage",
    method: Method.GET,
    useAuth: false,
    useCsrf: false,
    routeMatcher: "/login",
    impl: async (req, res) => {
        return res.status(statusOk()).html(
            frontendWithTitle("login").setComponent(usernamePasswordModal(false))
        );
    },
}

export const logout: ApiEndpoint = {
    name: "logout",
    method: Method.GET,
    useAuth: true,
    useCsrf: false,
    onUnauthorized: async (req, res) => {
        return res.redirect(new URL(req.protocol + "://" + req.get("host") + "/login"));
    },
    routeMatcher: "/logout",
    impl: async (req, res) => {
        return res.removeCookie(cookieName()).redirect(
            new URL(req.protocol + "://" + req.get("host") + "/login")
        );
    },
}
