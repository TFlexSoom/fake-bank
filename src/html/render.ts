import { compile } from 'pug'

export interface Frontend {
    title: string,
    component: FrontendComponent | null,
}

export interface FrontendComponent {
    val: string
}

export function frontendWithTitle(title: string): Frontend {
    return {
        title: structuredClone(title),
        component: null,
    };
}

const page = compile(`
<html>
head
    meta(charset="UTF-8")
    meta(name="viewport" content="width=device-width, initial-scale=1.0")
    meta(http-equiv="X-UA-Compatible" content="ie=edge")
    title #{self.title}
    link(rel="stylesheet" href="styles.css")
    script(src="https://unpkg.com/htmx.org@1.9.12")
body
    h1 THE FAKE BANK
    !{self.component}
</html>
`)

const component = compile(`
div 
    hi there
`)

export function renderFrontend(frontend: Frontend) {
    page({
        title: frontend.title,
        component: component({
            val: frontend.component ? frontend.component.val : ""
        }),
    })
}
