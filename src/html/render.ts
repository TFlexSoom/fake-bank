import { compile } from 'pug'
import { Frontend } from '../type/frontend';

export function frontendWithTitle(title: string): Frontend {
    return new Frontend(title);
}

// Using CDN Play for Tailwind is not performant... but the alternative is
// a. putting the pug templates in a separate file
// b. rolling out our own solution for compiling templates
// which is not really great either.
const page = compile(`
<html>
head
    meta(charset="UTF-8")
    meta(name="viewport" content="width=device-width, initial-scale=1.0")
    meta(http-equiv="X-UA-Compatible" content="ie=edge")
    title #{self.title}
    script(src="https://cdn.tailwindcss.com")
    script(src="https://unpkg.com/htmx.org@1.9.12")
    script(src="https://unpkg.com/htmx.org@1.9.12/dist/ext/json-enc.js")
<body class="px-[20%] py-[5%] bg-gradient-to-br from-zinc-700 to-stone-700">
    div(class="flex flex-col items-center min-h-screen bg-gradient-to-r from-indigo-200 from-80% to-blue-200 py-20 rounded-lg")
        div(class="p-5")    
            div(class="bg-[#FFFFFF77] p-5 rounded-lg")
                h1(class="text-[48px] font-sans font-bold text-slate-700") THE FAKE BANK
        div(class="flex flex-col items-center p-5 min-w-[100%] min-h-[100%]")
            div(class="flex flex-col items-center bg-gradient-to-b from-[#FFFFFF33] from-60% to-[#FFFFFF11] min-w-[80%] min-h-[60em] py-6 ")
                span
                | !{self.component}
</body>
</html>
`, {
    self: true,
});

export function renderFrontend(frontend: Frontend) {
    return frontend.compile(page);
}
