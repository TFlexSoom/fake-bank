import { compile } from 'pug'
import { FrontendComponent } from '../type/frontend';
import { Account, User } from '../data/user';

const template = `
div(class="flex flex-col items-center justify-center")
    h2(class="text-[48px] text-slate-700 text-bold") Welcome #{self.name}   
`

export function dashboardComponent(user: User, accounts: Array<Account>): FrontendComponent {
    return new FrontendComponent({
        name: user.username,
    }, compile(template, {
        self: true,
    }));
}


