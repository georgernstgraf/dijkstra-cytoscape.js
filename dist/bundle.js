// src/cyto.ts
var cytoscape = globalThis.cytoscape;
function cytoFactory(elements) {
  console.log("Cytoscape elements:", elements);
  options.elements = elements;
  return cytoscape(options);
}
var options = {
  elements: [],
  container: document.getElementById("cy-canvas"),
  // container to render in
  style: [
    // the stylesheet for the graph
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
        "text-halign": "center",
        // Center horizontally
        "text-valign": "center",
        // Center vertically
        "text-margin-y": 0,
        // No vertical margin
        "text-margin-x": 0
        // No horizontal margin
      }
    },
    {
      selector: "node.highlighted",
      style: {
        "background-color": "#f60",
        "color": "#600"
      }
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
        "text-outline-color": "#262",
        // Black outline
        "text-outline-width": 1
      }
    },
    {
      selector: "edge.highlighted",
      style: {
        "line-color": "#f60",
        "target-arrow-color": "#f60",
        "width": 1.5
      }
    }
  ],
  layout: {
    name: "cose"
  }
};

// src/dijkstra.ts
var Node = class _Node {
  static getDistance(n) {
    return n.data("distance");
  }
  static setDistance(n, value) {
    n.data("distance", value);
  }
  static getPrevious(n) {
    if (!n.data("previous"))
      return null;
    return n.cy().getElementById(n.data("previous"));
  }
  static setPrevious(n, value) {
    n.data("previous", value);
  }
  static isFinalized(n) {
    return n.data("finalized");
  }
  static setFinalized(n, value = true) {
    n.data("finalized", value);
  }
  static getDistToCur(n) {
    return n.data("dist_to_cur");
  }
  static setDistToCur(n, value) {
    n.data("dist_to_cur", value);
  }
  static toString(n) {
    return `Node ${n.id()}: distance = ${_Node.getDistance(n)}, previous = ${_Node.getPrevious(n)?.id() ?? "null"}, finalized = ${_Node.isFinalized(n)}, distCur = ${_Node.getDistToCur(n)}`;
  }
};
function dijkstra(graph, start, end) {
  const entdeckte = /* @__PURE__ */ new Set();
  entdeckte.add(start);
  for (const node of graph.nodes()) {
    Node.setDistance(node, Infinity);
    Node.setPrevious(node, null);
    Node.setFinalized(node, false);
  }
  Node.setDistance(start, 0);
  while (entdeckte.size > 0) {
    console.log("Entdeckte Nodes Size:", entdeckte.size);
    const currentSmallest = Array.from(entdeckte).reduce((a, b) => Node.getDistance(a) < Node.getDistance(b) ? a : b);
    if (currentSmallest === end) {
      console.log("Ende gefunden:", Node.toString(currentSmallest));
      break;
    }
    Node.setFinalized(currentSmallest);
    console.log(
      "Current Smallest entdeckte",
      Node.toString(currentSmallest)
    );
    console.log(
      "Starte Entdecken davon ausgehend"
    );
    for (const edge of currentSmallest.connectedEdges()) {
      const nachbar = edge.source() === currentSmallest ? edge.target() : edge.source();
      if (Node.isFinalized(nachbar))
        continue;
      entdeckte.add(nachbar);
      Node.setDistToCur(nachbar, edge.data("weight"));
      console.log(
        "Nachbar:",
        Node.toString(nachbar)
      );
      const alt = Node.getDistance(currentSmallest) + Node.getDistToCur(nachbar);
      if (alt < Node.getDistance(nachbar)) {
        Node.setDistance(nachbar, alt);
        Node.setPrevious(nachbar, currentSmallest.id());
        console.log(
          "UPDATE: ",
          Node.toString(nachbar)
        );
      }
    }
    entdeckte.delete(currentSmallest);
    console.log("Abgeschlossen:", Node.toString(currentSmallest));
  }
  const path = [];
  let currentEnd = end;
  while (currentEnd) {
    console.log(
      "Return: Current End Node:",
      currentEnd.id()
    );
    path.unshift(currentEnd);
    currentEnd = Node.getPrevious(currentEnd);
  }
  return path.length > 1 ? path : [];
}

// src/app.ts
var App = class _App {
  supply_url = "https://grafg1.spengergasse.at/graphsupply/adjacency-weighted";
  dom_nodes = {};
  cy = null;
  constructor() {
    console.log("App initialized");
    this.init();
  }
  init() {
    console.log("init called");
    const choose = document.getElementById("choose");
    this.dom_nodes["choose"] = choose;
    choose.addEventListener("change", async () => {
      await this.graph_chosen();
    });
    this.init_graphselect();
    this.dom_nodes["select-start"] = document.getElementById(
      "select-start"
    );
    this.dom_nodes["select-end"] = document.getElementById(
      "select-end"
    );
    const theme = globalThis.localStorage.getItem("ui-theme");
    if (theme) {
      const html = document.documentElement;
      html.setAttribute("data-bs-theme", theme);
    }
    this.dom_nodes["theme-toggle"] = document.getElementById(
      "theme-toggle"
    );
    this.dom_nodes["theme-toggle"].addEventListener("click", () => {
      const html = document.documentElement;
      const theme2 = html.getAttribute("data-bs-theme");
      const toggled_theme = theme2 === "dark" ? "light" : "dark";
      html.setAttribute(
        "data-bs-theme",
        toggled_theme
      );
      globalThis.localStorage.setItem(
        "ui-theme",
        toggled_theme
      );
    });
    this.dom_nodes["btn_calculate"] = document.getElementById(
      "btn_calculate"
    );
    this.dom_nodes["btn_calculate"].addEventListener(
      "click",
      this.do_dijkstra.bind(this)
    );
  }
  do_dijkstra() {
    console.log("Dijkstra button clicked");
    if (!this.cy) {
      console.error("Cytoscape instance is not initialized.");
      return;
    }
    const start = this.cy.getElementById(
      this.dom_nodes["select-start"]?.value
    );
    const end = this.cy.getElementById(
      this.dom_nodes["select-end"]?.value
    );
    if (!start || !end) {
      console.error("Start or end node not found.");
      return;
    }
    const path = dijkstra(this.cy, start, end);
    console.log("Shortest path:", path);
    this.cy.elements().removeClass("highlighted");
    for (let i = 0; i < path.length - 1; i++) {
      const edge = this.cy.getElementById(
        _App.createId(path[i].id(), path[i + 1].id())
      );
      edge.addClass("highlighted");
      path[i].addClass("highlighted");
    }
    path.at(-1)?.addClass("highlighted");
  }
  static createId(a, b) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }
  async graph_chosen() {
    const selectBox = this.dom_nodes["choose"];
    const selectedIndex = selectBox.selectedIndex;
    if (selectedIndex === 0) {
      console.log("No graph selected");
      return;
    }
    const selectedValue = selectBox.value;
    console.log("Selected value:", selectedValue);
    const json = await (await fetch(selectedValue)).json();
    console.log("JSON data:", json);
    if (!json.nodes) {
      let letters;
      const length = json.matrix.length;
      if (length > 26) {
        letters = Array.from(
          { length },
          (_, i) => String(i + 1)
        );
      } else {
        letters = Array.from(
          { length },
          (_, i) => String.fromCharCode(65 + i)
        );
        json.nodes = letters;
      }
    }
    this.populate_start_end(json.nodes);
    this.paint_graph(json);
  }
  paint_graph(json) {
    const names = json.nodes;
    const elements = { nodes: [], edges: [] };
    for (const name of names) {
      elements.nodes.push({ data: { id: name, label: name } });
    }
    for (let row = 0; row < names.length; row++) {
      for (let col = row + 1; col < names.length; col++) {
        if (json.matrix[row][col] > 0) {
          elements.edges.push({
            data: {
              id: _App.createId(names[row], names[col]),
              source: names[row],
              target: names[col],
              weight: json.matrix[row][col],
              // number!!
              label: String(
                json.matrix[row][col]
              )
            }
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
  populate_start_end(nodes) {
    const start = this.dom_nodes["select-start"];
    const end = this.dom_nodes["select-end"];
    start.innerHTML = "";
    end.innerHTML = "";
    for (const value of nodes) {
      const option1 = document.createElement("option");
      option1.value = value;
      option1.textContent = value;
      start.appendChild(option1);
      const option2 = document.createElement("option");
      option2.value = value;
      option2.textContent = value;
      end.appendChild(option2);
    }
    end.selectedIndex = end.options.length - 1;
  }
  init_graphselect() {
    const choose = this.dom_nodes["choose"];
    fetch(
      this.supply_url
    ).then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    }).then((data) => {
      choose.innerHTML = "";
      const option = document.createElement("option");
      option.textContent = "Choose a graph";
      choose.appendChild(option);
      for (const value of data) {
        const option2 = document.createElement("option");
        option2.value = value;
        option2.textContent = value.split("/").pop().split(".")[0];
        choose.appendChild(option2);
      }
    }).catch((error) => {
      console.error("Error fetching data:", error);
    });
  }
};

// src/main.ts
function main() {
  const app = new App();
  globalThis.app = app;
  setTimeout(() => {
    const choose = app.dom_nodes["choose"];
    choose.selectedIndex = Math.floor(Math.random() * (choose.options.length - 1)) + 1;
    choose.dispatchEvent(new Event("change"));
  }, 1e3);
}
main();
//# sourceMappingURL=bundle.js.map
