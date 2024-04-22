import { cookieName } from "../../auth";
import { generateToken } from "../../auth/jwt";
import { validatePassword } from "../../auth/password";
import { getEmptyUser, getUserFromUsername } from "../../data/user";
import { ApiEndpoint, Method } from "../../type/apiEndpoint";

interface LoginPayload {
    username?: string,
    password?: string,
}

export const login: ApiEndpoint = {
    name: "login",
    method: Method.POST,
    useAuth: false,
    routeMatcher: "/login",
    impl: async (req, res) => {
        const { username, password } = req.body as LoginPayload;
        if (username === undefined) {
            res.status(400);
            return res.publicError("No Username Supplied!");
        } else if (password === undefined) {
            res.status(400);
            return res.publicError("No Password Supplied!");
        }

        const user = (await getUserFromUsername(username)) || getEmptyUser();
        const isValid = await validatePassword(user, password || "");
        if (!isValid) {
            res.status(401);
            return res.publicError("Unauthorized");
        }

        res.cookie(cookieName(), await generateToken(user.uuid));
        res.render("/dashboard");
    },
}

export const loginGet: ApiEndpoint = {
    name: "loginPage",
    method: Method.GET,
    useAuth: false,
    routeMatcher: "/login",
    impl: async (req, res) => {
        return res;
    },
}
