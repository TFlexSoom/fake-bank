import { compile } from 'pug'
import { FrontendComponent } from '../type/frontend';
import { Account, User } from '../data/user';

const template = `
div(class="flex flex-col justify-center w-[80%] ")
    h2(class="text-[48px] text-slate-700 text-bold") #{self.name}'s Dashboard
    div(class="flex flex-col py-4 w-[100%] ")
        div(class=" py-2 ")
            button(class=" px-2 py-4 min-w-[120px] " +
                " bg-gradient-to-r from-indigo-700 from-80% to-blue-700 " 
                hx-post=self.newAccount
            ) 
                span(class="text-white") New Account
        div(class=" py-2 ")
            button(class=" px-2 py-4 min-w-[120px] " +
                " bg-gradient-to-r from-indigo-700 from-80% to-blue-700 " 
                hx-get=self.logout
            ) 
                span(class="text-white") Logout
    if self.accounts.length > 0
        div(class="flex flex-col py-4")
            h3(class="text-[32px] text-slate-700 text-bold") Accounts
            ul
                each val in self.accounts
                    li(class="bg-gradient-to-r from-indigo-200 from-80% to-blue-200")
                        a(href="/details/" + val.uuid) Account #{val.uuid} With $#{val.cents}
`

export function dashboardComponent(user: User, accounts: Array<Account>): FrontendComponent {
    return new FrontendComponent({
        name: user.username,
        newAccount: "/account",
        logout: "/logout",
        accounts: accounts,
    }, compile(template, {
        self: true,
    }));
}


