import { CytoscapeOptions, ElementsDefinition } from "cytoscape";

const cytoscape = globalThis.cytoscape as typeof import("cytoscape");
export function cytoFactory(elements: ElementsDefinition) {
    console.log("Cytoscape elements:", elements);
    options.elements = elements;
    return cytoscape(options);
}
const options: CytoscapeOptions = {
    elements: [],
    container: document.getElementById("cy-canvas"), // container to render in
    style: [ // the stylesheet for the graph
        {
            selector: "node",
            style: {
                "background-color": "#600",
                "label": "data(label)",
                "font-weight": "bold",
                "height": "10px",
                "width": "10px",
                "color": "#f60",
                "font-size": "6px",
                "text-halign": "center", // Center horizontally
                "text-valign": "center", // Center vertically
                "text-margin-y": 0, // No vertical margin
                "text-margin-x": 0, // No horizontal margin
            },
        },
        {
            selector: "node.highlighted",
            style: {
                "background-color": "#f60",
                "color": "#600",
            },
        },
        {
            selector: "edge",
            style: {
                "width": "1px",
                "font-size": "6px",
                "color": "#ffa",
                "label": "data(label)",
                "line-color": "#262",
                "target-arrow-color": "#262",
                "target-arrow-shape": "none",
                "curve-style": "bezier",
                "text-outline-color": "#262", // Black outline
                "text-outline-width": 1,
            },
        },
        {
            selector: "edge.highlighted",
            style: {
                "line-color": "#f60",
                "target-arrow-color": "#f60",
                "width": 1.5,
            },
        },
    ],
    layout: {
        name: "cose",
    },
};
