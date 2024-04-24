import { compile } from 'pug'
import { FrontendComponent } from '../type/frontend';
import { Account, User } from '../data/user';

export function detailsComponent(user: User, account: Account): FrontendComponent {
    return new FrontendComponent({
        name: user.username,
        accountUuid: account.uuid,
        balance: (account.cents.toNumber() / 100).toFixed(2).toString(),
    }, compile(`
        div(class="flex flex-col items-center justify-center")
            h2(class="text-[48px] text-slate-700 text-bold") Welcome #{self.name}   
            h4(class="text-[24px] text-slate-700 text-bold") Your Account #{self.accountuuid}
            h6(class="text-[18px] text-slate-600 text-bold font-mono") #{self.balance}

            div(class="p-3")
                a(class=" py-3 px-5 bg-violet-500 " +
                    " rounded-lg text-[24px] text-bold "
                    href="/dashboard") Back To Dashboard
        `, {
        self: true,
    }));
}

