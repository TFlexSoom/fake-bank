import { compile } from 'pug'
import { FrontendComponent } from '../type/frontend';
import { Account, User } from '../data/user';

const template = `
div(class="flex flex-col items-center justify-center")
    h2(class="text-[48px] text-slate-700 text-bold") Make a Transfer #{self.name}

    if self.accounts.length === 0
        h4(class="text-[24px] text-slate-700 text-bold") No Accounts To Transfer From
    else
        form(class="flex flex-col w-[100%]" hx-post=self.path hx-ext="json-enc")
            input(class="invisible" name="nonce" value=self.nonce) 
            div(class="flex flex-col")
                label(class="text-[24px] text-slate-700 text-bold") Select Account
                select(class="pt-1 text-[18px] font-sans" name="receiver")
                    each account, index in self.accounts
                        option(value=account default=(index === 0)) #{account}
                        
            div(class="flex flex-col")
                label(class="text-[24px] text-slate-700 text-bold") Amount Dollars
                div(class="pt-2 w-[100%]")
                    input(
                        class="pl-1 pt-1 text-[18px] font-sans w-[100%]" 
                        type="text" 
                        name="money" 
                        placeholder="100.00"
                    )
            div(class="py-8")
                button(class=" py-3 px-5 bg-violet-500 " +
                    " rounded-lg text-[24px] text-bold " 
                    type="submit") Submit


    div(class="p-3")
        a(class=" py-3 px-5 bg-violet-500 " +
            " rounded-lg text-[24px] text-bold "
            href="/dashboard") Back To Dashboard
`

export function loanComponent(user: User, accounts: Array<Account>): FrontendComponent {
    return new FrontendComponent({
        path: "/loan",
        name: user.username,
        accounts: accounts.map((account) => account.uuid.toString()),
    }, compile(template, {
        self: true,
    }));
}