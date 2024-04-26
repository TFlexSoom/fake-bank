import { cookieName } from "../../auth";
import { generateToken } from "../../auth/jwt";
import { generatePassword, passwordResultSuccess } from "../../auth/password";
import { isValidUsername } from "../../auth/username";
import { lockRegisterRequest } from "../../data/ratelimit";
import { createUser } from "../../data/user";
import { usernamePasswordModal } from "../../html/modal";
import { frontendWithTitle } from "../../html/render";
import { ApiEndpoint, Method } from "../../type/apiEndpoint";
import { statusBadRequest, statusOk, statusServerError, statusUnauthorized } from "../../type/status";

interface RegisterPayload {
    username?: string,
    password?: string,
}

export const registerPost: ApiEndpoint = {
    name: "register",
    method: Method.POST,
    useAuth: false,
    useCsrf: true,
    routeMatcher: "/register",
    impl: async (req, res) => {
        const { username, password } = req.body as RegisterPayload;
        if (!isValidUsername(username)) {
            return res.status(statusBadRequest()).publicError("Bad Username Supplied!");
        }

        const hashedPasswordResult = await generatePassword(password);
        if (!passwordResultSuccess(hashedPasswordResult)) {
            return res.status(statusBadRequest()).publicError(hashedPasswordResult.error);
        }

        if (! await lockRegisterRequest(req.ip)) {
            return res.status(statusBadRequest()).publicError("Limit Reached!");
        }

        const user = await createUser(username, hashedPasswordResult.hash);
        if (user === undefined) {
            return res.status(statusServerError()).publicError("Error creating user!");
        }

        res = res.cookie(cookieName(), await generateToken(user.uuid));
        return res.render(new URL(req.protocol + "://" + req.get("host") + "/dashboard"));
    },
}

export const registerGet: ApiEndpoint = {
    name: "registerPage",
    method: Method.GET,
    useAuth: false,
    useCsrf: false,
    routeMatcher: "/register",
    impl: async (req, res) => {
        return res.status(statusOk()).html(
            frontendWithTitle("register").setComponent(usernamePasswordModal(true))
        );
    },
}
