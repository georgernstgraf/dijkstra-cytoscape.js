import { App } from "./app.ts";

declare global {
    // Augment the globalThis type to include 'app'
    var app: App;
}

function main(): void {
    const app = new App();
    globalThis.app = app;
    setTimeout(() => {
        const choose: HTMLSelectElement = app
            .dom_nodes["choose"]! as HTMLSelectElement;
        choose.selectedIndex =
            Math.floor(Math.random() * (choose.options.length - 1)) + 1; // first is "choose a graph"
        choose.dispatchEvent(new Event("change"));
    }, 1000);
}

main();
