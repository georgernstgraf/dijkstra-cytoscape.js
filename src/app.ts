import { cytoFactory } from "./cyto.ts";
import { Core, ElementsDefinition } from "cytoscape";
import { dijkstra } from "./dijkstra.ts";
// Add declaration for globalThis.ccyy
declare global {
    // Adjust the type of ccyy as needed
    var cy: ReturnType<typeof cytoFactory>;
}

interface SupplyJson {
    nodes: string[];
    edges: string[];
    matrix: number[][];
}
export class App {
    supply_url =
        "https://grafg1.spengergasse.at/graphsupply/adjacency-weighted";
    dom_nodes: Record<string, HTMLElement | null> = {};
    cy: Core | null = null;
    constructor() {
        console.log("App initialized");
        this.init();
    }
    init() { // Registering Dom Nodes and putting event listeners on them
        console.log("init called");
        const choose = document.getElementById("choose");
        this.dom_nodes["choose"] = choose;
        choose!.addEventListener("change", async () => {
            await this.graph_chosen();
        });
        this.init_graphselect();
        this.dom_nodes["select-start"] = document.getElementById(
            "select-start",
        );
        this.dom_nodes["select-end"] = document.getElementById(
            "select-end",
        );
        // init theme from local storage if available
        const theme = globalThis.localStorage.getItem("ui-theme");
        if (theme) {
            const html = document.documentElement;
            html.setAttribute("data-bs-theme", theme);
        }
        this.dom_nodes["theme-toggle"] = document.getElementById(
            "theme-toggle",
        ) as HTMLButtonElement;
        this.dom_nodes["theme-toggle"]!.addEventListener("click", () => {
            const html = document.documentElement;
            const theme = html.getAttribute("data-bs-theme");
            const toggled_theme = theme === "dark" ? "light" : "dark";
            html.setAttribute(
                "data-bs-theme",
                toggled_theme,
            );
            globalThis.localStorage.setItem(
                "ui-theme",
                toggled_theme,
            );
        });
        this.dom_nodes["btn_calculate"] = document.getElementById(
            "btn_calculate",
        );
        this.dom_nodes["btn_calculate"]!.addEventListener(
            "click",
            this.do_dijkstra.bind(this),
        );
        this.dom_nodes["load-random"] = document.getElementById("load-random");
        this.dom_nodes["load-random"]!.addEventListener("click", async () => {
            await this.load_random();
        });
        this.dom_nodes["density-label"] = document.getElementById(
            "density-label",
        );
        this.dom_nodes["density"] = document.getElementById("density");
        this.dom_nodes["density"]!.addEventListener("change", () => {
            const value = (this.dom_nodes["density"] as HTMLInputElement).value;
            (this.dom_nodes["density-label"] as HTMLLabelElement).textContent =
                "Density: " + value;
        });
        this.dom_nodes["nodes-label"] = document.getElementById("nodes-label");
        this.dom_nodes["nodes"] = document.getElementById("nodes");
        this.dom_nodes["nodes"]!.addEventListener("change", () => {
            const value = (this.dom_nodes["nodes"] as HTMLInputElement).value;
            (this.dom_nodes["nodes-label"] as HTMLLabelElement).textContent =
                "Nodes: " + value;
        });
    }
    async load_random() {
        const response = await fetch(
            //"https://grafg1.spengergasse.at/graphsupply/random",
            "/graphsupply/random",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    "density":
                        (this.dom_nodes["density"] as HTMLInputElement)
                            .valueAsNumber,
                    "nodes":
                        (this.dom_nodes["nodes"] as HTMLInputElement)
                            .valueAsNumber,
                    "weighted": true,
                }),
            },
        );
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const json = await response.json();
        App.json_add_named_nodes(json);
        this.populate_start_end(json.nodes);
        this.paint_graph(json);

        console.log("Random graph data:", json);
        //this.paint_graph(data);
    }
    // Handle the response data here

    do_dijkstra() {
        console.log("Dijkstra button clicked");
        if (!this.cy) {
            console.error("Cytoscape instance is not initialized.");
            return;
        }
        const start = this.cy.getElementById(
            (this.dom_nodes["select-start"] as HTMLSelectElement)?.value,
        );
        const end = this.cy.getElementById(
            (this.dom_nodes["select-end"] as HTMLSelectElement)?.value,
        );
        if (!start || !end) {
            console.error("Start or end node not found.");
            return;
        }
        const path = dijkstra(this.cy, start, end);
        console.log("Shortest path:", path);
        // Highlight the path
        this.cy.elements().removeClass("highlighted");
        for (let i = 0; i < path.length - 1; i++) {
            const edge = this.cy.getElementById(
                App.createId(path[i].id(), path[i + 1].id()),
            );
            edge.addClass("highlighted");
            path[i].addClass("highlighted");
        }
        path.at(-1)?.addClass("highlighted");
    }
    static createId(a: string, b: string): string {
        return a < b ? `${a}|${b}` : `${b}|${a}`;
    }
    async graph_chosen() {
        // handle change event
        const selectBox = this.dom_nodes["choose"] as HTMLSelectElement;
        const selectedIndex = selectBox.selectedIndex;
        if (selectedIndex === 0) {
            console.log("No graph selected");
            return;
        }
        const selectedValue = selectBox.value;
        console.log("Selected value:", selectedValue);
        const json: SupplyJson = await (await fetch(selectedValue)).json();
        console.log("JSON data:", json);
        // have to handle nodenames myself
        if (!json.nodes) {
            App.json_add_named_nodes(json);
        }
        this.populate_start_end(json.nodes);
        this.paint_graph(json);
    }
    static json_add_named_nodes(json: SupplyJson) {
        // letters or numbers depending on matrix.length
        let letters;
        const length = json.matrix.length;
        if (length > 26) {
            letters = Array.from(
                { length },
                (_, i) => String(i + 1),
            );
        } else {
            letters = Array.from(
                { length },
                (_, i) => String.fromCharCode(65 + i),
            );
        }
        json.nodes = letters;
    }
    paint_graph(json: SupplyJson) {
        //        json.nodes: ["A", "B", "C"]     json.matrix: [][];

        const names = json.nodes;
        const elements: ElementsDefinition = { nodes: [], edges: [] };
        // Create nodes first
        for (const name of names) {
            elements.nodes.push({ data: { id: name, label: name } });
        }
        // Create edges
        for (let row = 0; row < names.length; row++) {
            for (let col = row + 1; col < names.length; col++) { // only upper right triangle
                if (json.matrix[row][col] > 0) {
                    elements.edges.push({
                        data: {
                            id: App.createId(names[row], names[col]),
                            source: names[row],
                            target: names[col],
                            weight: json.matrix[row][col], // number!!
                            label: String(
                                json.matrix[row][col],
                            ),
                        },
                    });
                }
            }
        }
        if (globalThis.cy) {
            globalThis.cy.destroy();
        }
        const cy = cytoFactory(elements);
        globalThis.cy = cy;
        this.cy = cy;
    }

    populate_start_end(nodes: string[]) {
        const start = this.dom_nodes["select-start"];
        const end = this.dom_nodes["select-end"] as HTMLSelectElement;
        start!.innerHTML = "";
        end!.innerHTML = "";
        for (const value of nodes) {
            const option1 = document.createElement("option");
            option1.value = value;
            option1.textContent = value;
            start!.appendChild(option1);
            const option2 = document.createElement("option");
            option2.value = value;
            option2.textContent = value;
            end!.appendChild(option2);
        }
        // Second select box has last node as preselected default
        end!.selectedIndex = end!.options.length - 1;
    }
    init_graphselect() {
        const choose = this.dom_nodes["choose"];
        fetch(
            this.supply_url,
        ).then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        }).then((data) => {
            choose!.innerHTML = "";
            const option = document.createElement("option");
            option.textContent = "Choose a graph";
            choose!.appendChild(option);
            for (const value of data) {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = value.split("/").pop()!.split(".")[0];
                choose!.appendChild(option);
            }
        }).catch((error) => {
            console.error("Error fetching data:", error);
        });
    }
}
