import { ApiEndpoint, Method } from "../../type/apiEndpoint";

const rootRedirect: ApiEndpoint = {
    name: "root",
    method: Method.GET,
    useAuth: true,
    onUnauthorized:
        async (req, res) => {
            return res.redirect(new URL(req.baseUrl + "/login"));
        },
    routeMatcher: "/",
    impl: async (req, res) => {
        return res.redirect(new URL(req.baseUrl + "/dashboard"));
    },
}

export const Endpoints = [
    rootRedirect,
]