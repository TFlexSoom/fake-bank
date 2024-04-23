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

    compile(page) {
        return page({
            title: structuredClone(this.title),
            component: this.component.compile(),
        })
    }
}

export class FrontendComponent {
    private dynamic: Record<string, string>;
    private compiler: (locale: Record<string, string>) => string;

    constructor(dynamic, compiler) {
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

    compile(): string {
        return this.compiler(structuredClone(this.dynamic));
    }
}