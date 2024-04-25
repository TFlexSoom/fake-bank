import { compile } from 'pug'
import { FrontendComponent } from '../type/frontend';
import { Account, User } from '../data/user';

const template = `
div(class="flex flex-col items-center justify-center")
    h2(class="text-[48px] text-slate-700 text-bold") Make a Transfer #{self.name}

    div(class="p-3")
        a(class=" py-3 px-5 bg-violet-500 " +
            " rounded-lg text-[24px] text-bold "
            href="/dashboard") Back To Dashboard
`

export function transferComponent(user: User, accounts: Array<Account>): FrontendComponent {
    return new FrontendComponent({
        name: user.username,
    }, compile(template, {
        self: true,
    }));
}


