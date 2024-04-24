import { Account, createAccountForUser, getUserAndAccountsFromUuid } from "../../data/user";
import { detailsComponent } from "../../html/details";
import { frontendWithTitle } from "../../html/render";
import { ApiEndpoint, Method } from "../../type/apiEndpoint";
import { statusBadRequest, statusOk, statusServerError, statusUnauthorized } from "../../type/status";
import { Uuid } from "../../type/uuid";

export const details: ApiEndpoint = {
    name: "details",
    method: Method.GET,
    useAuth: true,
    onUnauthorized:
        async (req, res) => {
            return res.redirect(new URL(req.protocol + "://" + req.get("host") + "/login"));
        },
    routeMatcher: "/details/:accountId",
    impl: async (req, res) => {
        const uuid = req["user"] as Uuid;
        if (uuid === undefined) {
            return res.status(statusServerError()).publicError("could not grab user");
        }

        const accountUuidStr = req.params.accountId;
        if (!Uuid.validateString(accountUuidStr)) {
            return res.status(statusBadRequest()).render(new URL(req.protocol + "://" + req.get("host") + "/login"));
        }
        const accountUuid = Uuid.fromString(accountUuidStr);
        const userAndAccounts = await getUserAndAccountsFromUuid(uuid);
        let foundAccount: Account | null = null;
        for (const account of userAndAccounts.accounts) {
            if (account.uuid === accountUuid) {
                foundAccount = account;
            }
        }

        if (foundAccount === null) {
            return res.status(statusBadRequest()).render(new URL(req.protocol + "://" + req.get("host") + "/login"));
        }

        return res.status(statusOk()).html(
            frontendWithTitle("details").setComponent(detailsComponent(userAndAccounts.user, foundAccount))
        );
    },
}

const maxAccounts = 10;

export const newAccount: ApiEndpoint = {
    name: "newAccount",
    method: Method.POST,
    useAuth: true,
    onUnauthorized:
        async (req, res) => {
            return res.redirect(new URL(req.protocol + "://" + req.get("host") + "/login"));
        },
    routeMatcher: "/account",
    impl: async (req, res) => {
        const uuid = req["user"] as Uuid;
        if (uuid === undefined) {
            return res.status(statusServerError()).publicError("could not grab user");
        }

        const userAndAccounts = await getUserAndAccountsFromUuid(uuid);
        if (userAndAccounts.accounts.length >= maxAccounts) {
            return res.status(statusBadRequest()).publicError("too many accounts");
        }

        const account = await createAccountForUser(userAndAccounts.user);
        if(account === undefined) {
            return res.status(statusServerError()).publicError("could not grab account");
        }

        return res.redirect(new URL(req.protocol + "://" + req.get("host") + "/details/" + account.uuid.toString()));
    },
}