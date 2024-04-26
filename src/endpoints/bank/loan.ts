import { lockTransaction } from "../../data/ratelimit";
import { getUserAndAccountsFromUuid, isEmptyUser, loanMoneyToAccount } from "../../data/user";
import { frontendWithTitle } from "../../html/render";
import { loanComponent } from "../../html/loan";
import { ApiEndpoint, Method } from "../../type/apiEndpoint";
import { Integer } from "../../type/integer";
import { statusBadRequest, statusOk, statusServerError } from "../../type/status";
import { Uuid } from "../../type/uuid";

export const loanPage: ApiEndpoint = {
    name: "loanPage",
    method: Method.GET,
    useAuth: true,
    useCsrf: false,
    onUnauthorized:
        async (req, res) => {
            return res.redirect(new URL(req.protocol + "://" + req.get("host") + "/login"));
        },
    routeMatcher: "/loan",
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
            frontendWithTitle("loan").setComponent(
                loanComponent(userAndAccounts.user, userAndAccounts.accounts)
            )
        );
    },
}

interface Loan {
    receiver: string,
    money: number,
}

export const loan: ApiEndpoint = {
    name: "loan",
    method: Method.POST,
    useAuth: true,
    useCsrf: true,
    onUnauthorized:
        async (req, res) => {
            return res.redirect(new URL(req.protocol + "://" + req.get("host") + "/login"));
        },
    routeMatcher: "/loan",
    impl: async (req, res) => {
        const uuid = req["user"] as Uuid;
        if (uuid === undefined || uuid === null) {
            return res.status(statusServerError()).publicError("could not grab user");
        }

        const {
            receiver,
            money,
        } = req.body as Loan;
        console.log(receiver);
        if (!Uuid.validateString(receiver)) {
            return res.status(statusBadRequest()).publicError("not valid uuid");
        }

        if (!/^[0-9]+(\.[0-9]{2,2})?$/.test(String(money))) {
            return res.status(statusBadRequest()).publicError("not valid money amount");
        }

        if (! await lockTransaction(req.ip)) {
            return res.status(statusBadRequest()).publicError("Limit Reached!");
        }

        const receiverAccount = Uuid.fromString(receiver);
        const cents = new Integer(money * 100);

        const err = await loanMoneyToAccount(uuid, receiverAccount, cents);
        if (err !== undefined) {
            return res.status(statusBadRequest()).publicError(err);
        }

        return res.redirect(new URL(req.protocol + "://" + req.get("host") + "/dashboard"));
    },
}
