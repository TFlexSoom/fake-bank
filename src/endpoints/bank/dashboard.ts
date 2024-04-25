import { getUserAndAccountsFromUuid, isEmptyUser } from "../../data/user";
import { dashboardComponent } from "../../html/dashboard";
import { frontendWithTitle } from "../../html/render";
import { ApiEndpoint, Method } from "../../type/apiEndpoint";
import { statusOk, statusServerError } from "../../type/status";
import { Uuid } from "../../type/uuid";

export const dashboard: ApiEndpoint = {
    name: "dashboard",
    method: Method.GET,
    useAuth: true,
    onUnauthorized:
        async (req, res) => {
            return res.redirect(new URL(req.protocol + "://" + req.get("host") + "/login"));
        },
    routeMatcher: "/dashboard",
    impl: async (req, res) => {
        const uuid = req["user"] as Uuid;
        if (uuid === undefined || uuid === null) {
            return res.status(statusServerError()).publicError("could not grab user");
        }

        const userAndAccounts = await getUserAndAccountsFromUuid(uuid);
        if (isEmptyUser(userAndAccounts.user)) {
            res.redirect(new URL(req.protocol + "://" + req.get("host") + "/login"));
        }

        return res.status(statusOk()).html(
            frontendWithTitle("dashboard").setComponent(dashboardComponent(userAndAccounts.user, userAndAccounts.accounts))
        );
    },
}
