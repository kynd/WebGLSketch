export class SceneBase {
    constructor(context) {
        this.context = context;
    }

    async loadShader(url) {
        const response = await fetch(url);
        return await response.text();
    }

    async setup() {
        await this.setupMain();
        this.ready = true;
    }

    async setupMain() {}
}
