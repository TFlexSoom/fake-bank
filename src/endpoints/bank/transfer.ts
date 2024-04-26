import { lockTransaction } from "../../data/ratelimit";
import { getUserAndAccountsFromUuid, isEmptyUser, transferFromAccountToAccount } from "../../data/user";
import { frontendWithTitle } from "../../html/render";
import { transferComponent } from "../../html/transfer";
import { ApiEndpoint, Method } from "../../type/apiEndpoint";
import { Integer } from "../../type/integer";
import { statusBadRequest, statusOk, statusServerError } from "../../type/status";
import { Uuid } from "../../type/uuid";

export const transferPage: ApiEndpoint = {
    name: "transferPage",
    method: Method.GET,
    useAuth: true,
    useCsrf: false,
    onUnauthorized:
        async (req, res) => {
            return res.redirect(new URL(req.protocol + "://" + req.get("host") + "/login"));
        },
    routeMatcher: "/transfer",
    impl: async (req, res) => {
        const uuid = req["user"] as Uuid;
        if (uuid === undefined || uuid === null) {
            return res.status(statusServerError()).publicError("could not grab user");
        }

        const userAndAccounts = await getUserAndAccountsFromUuid(uuid);
        if (isEmptyUser(userAndAccounts.user)) {
            return res.redirect(new URL(req.protocol + "://" + req.get("host") + "/login"));
        }

        return res.status(statusOk()).html(
            frontendWithTitle("transfer").setComponent(
                transferComponent(userAndAccounts.user, userAndAccounts.accounts)
            )
        );
    },
}

interface Transfer {
    sender: string,
    receiver: string,
    money: number,
}

export const transfer: ApiEndpoint = {
    name: "transfer",
    method: Method.POST,
    useAuth: true,
    useCsrf: true,
    onUnauthorized:
        async (req, res) => {
            return res.redirect(new URL(req.protocol + "://" + req.get("host") + "/login"));
        },
    routeMatcher: "/transfer",
    impl: async (req, res) => {
        const uuid = req["user"] as Uuid;
        if (uuid === undefined || uuid === null) {
            return res.status(statusServerError()).publicError("could not grab user");
        }

        const {
            sender,
            receiver,
            money,
        } = req.body as Transfer;

        if (!Uuid.validateString(sender) || !Uuid.validateString(receiver)) {
            return res.status(statusBadRequest()).publicError("not valid uuids");
        }

        if (!/^[0-9]+(\.[0-9]{2,2})?$/.test(String(money))) {
            return res.status(statusBadRequest()).publicError("not valid money amount");
        }

        if (! await lockTransaction(req.ip)) {
            return res.status(statusBadRequest()).publicError("Limit Reached!");
        }

        const senderAccount = Uuid.fromString(sender);
        const receiverAccount = Uuid.fromString(receiver);
        const cents = new Integer(money * 100);

        const err = await transferFromAccountToAccount(uuid, senderAccount, receiverAccount, cents);
        if (err !== undefined) {
            return res.status(statusBadRequest()).publicError(err);
        }

        return res.redirect(new URL(req.protocol + "://" + req.get("host") + "/dashboard"));
    },
}
