import { compile } from 'pug'
import { FrontendComponent } from '../type/frontend';

const modal = compile(`
div(class="flex flex-col items-center justify-center")
    h3(class="text-[32px] text-slate-700 text-bold") #{self.modalTitle}
    form(class="flex flex-col items-center justify-start" hx-post="#{self.path}" hx-ext="json-enc")
        div(class="flex flex-row items-center justify-center")
            label(class="text-[24px] text-slate-700 text-bold") Username
            span(class="p-2")
            input(class="pl-1 pt-1 text-[18px] font-sans" type="text" name="username" placeholder="username")
        div(class="pl-1 flex flex-row items-center justify-center")
            label(class="text-[24px] text-slate-700 text-bold") Password
            span(class="p-2")
            input(class="pl-1 pt-1 text-[18px] font-sans" type="password" name="password" placeholder="password")
        div(class="p-3")
            button(class=" py-3 px-5 bg-violet-500 " +
                " rounded-lg text-[24px] text-bold " 
                type="submit") Submit
    if self.linkToRegister
        div(class="p-3")
            a(class=" py-3 px-5 bg-violet-500 " +
                " rounded-lg text-[24px] text-bold "
                href="/register") Signup instead
`, {
    self: true,
})

export function usernamePasswordModal(isRegister: boolean): FrontendComponent {
    return new FrontendComponent({
        modalTitle: isRegister ? "Register Now" : "Login Now",
        path: isRegister ? "/register" : "/login",
        linkToRegister: !isRegister,
    }, modal);
}
