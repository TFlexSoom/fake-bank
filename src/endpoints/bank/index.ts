import { ApiEndpoint } from "../../type/apiEndpoint";

const rootRedirect: ApiEndpoint = {
    name: "root",
    useAuth: true,
    onUnauthorized:
        (req, res) => {
            return res.redirect(new URL(req.baseUrl + "/login"));
        },
    routeMatcher: "/",
    impl: (req, res) => {
        return res.redirect(new URL(req.baseUrl + "/dashboard"));
    },
}