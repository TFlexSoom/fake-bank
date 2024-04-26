export function nonceFieldName(): string {
    return "token";
}

export interface FrontendGlobals {
    nonce: string,
}

export class Frontend {
    private title: string;
    private component: FrontendComponent;

    constructor(title) {
        if (title === "") {
            throw new Error("title is empty");
        }

        this.title = structuredClone(title);
        this.component = FrontendComponent.empty();
        Object.freeze(this.title);
        Object.seal(this);
    }

    setComponent(component: FrontendComponent): Frontend {
        this.component = component.clone();
        return this;
    }

    getComponent(): FrontendComponent {
        return this.component.clone();
    }

    clone(): Frontend {
        const clone = new Frontend(this.title);
        clone.setComponent(this.component);
        return clone;
    }

    compile(page: (locales: Record<string, any>) => string, globals: FrontendGlobals) {
        return page({
            title: structuredClone(this.title),
            component: this.component.compile(globals),
            // not needed but could be added
            //...globals
        })
    }
}

type Compiler = (locale: Record<string, any>) => string;

export class FrontendComponent {
    private dynamic: Record<string, any>;
    private compiler: Compiler;

    constructor(dynamic: Record<string, any>, compiler: Compiler) {
        this.dynamic = structuredClone(dynamic);
        this.compiler = compiler;
        Object.freeze(this);
    }

    static empty() {
        return new FrontendComponent({}, (locale) => "");
    }

    clone(): FrontendComponent {
        return new FrontendComponent(this.dynamic, this.compiler);
    }

    compile(globals: FrontendGlobals): string {
        return this.compiler(structuredClone(
            {
                ...this.dynamic,
                ...globals,
            }
        ));
    }
}