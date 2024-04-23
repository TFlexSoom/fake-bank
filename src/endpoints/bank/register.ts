import { cookieName } from "../../auth";
import { generateToken } from "../../auth/jwt";
import { validatePassword } from "../../auth/password";
import { getEmptyUser, getUserFromUsername } from "../../data/user";
import { frontendWithTitle } from "../../html/render";
import { ApiEndpoint, Method } from "../../type/apiEndpoint";
import { statusBadRequest, statusOk, statusUnauthorized } from "../../type/status";

interface RegisterPayload {
    username?: string,
    password?: string,
}

export const registerPost: ApiEndpoint = {
    name: "register",
    method: Method.POST,
    useAuth: false,
    routeMatcher: "/register",
    impl: async (req, res) => {
        const { username, password } = req.body as RegisterPayload;
        if (username === undefined) {
            return res.status(statusBadRequest()).publicError("No Username Supplied!");
        } else if (password === undefined) {
            return res.status(statusBadRequest()).publicError("No Password Supplied!");
        }

        const user = (await getUserFromUsername(username)) || getEmptyUser();
        const isValid = await validatePassword(user, password || "");
        if (!isValid) {
            return res.status(statusUnauthorized()).publicError("Unauthorized");
        }

        res = res.cookie(cookieName(), await generateToken(user.uuid));
        return res.render("/dashboard");
    },
}

export const loginGet: ApiEndpoint = {
    name: "loginPage",
    method: Method.GET,
    useAuth: false,
    routeMatcher: "/login",
    impl: async (req, res) => {
        return res.status(statusOk()).html(frontendWithTitle("login"));
    },
}
