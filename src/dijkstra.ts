import { Core, NodeSingular } from "cytoscape";
class Node {
    static getDistance(n: NodeSingular): number {
        return n.data("distance");
    }
    static setDistance(n: NodeSingular, value: number) {
        n.data("distance", value);
    }
    static getPrevious(n: NodeSingular): NodeSingular | null {
        if (!n.data("previous")) return null;
        return n.cy().getElementById(n.data("previous"));
    }
    static setPrevious(n: NodeSingular, value: string | null) {
        n.data("previous", value);
    }
    static isFinalized(n: NodeSingular): boolean {
        return n.data("finalized");
    }
    static setFinalized(n: NodeSingular, value: boolean = true) {
        n.data("finalized", value);
    }
    static getDistToCur(n: NodeSingular): number {
        return n.data("dist_to_cur");
    }
    static setDistToCur(n: NodeSingular, value: number) {
        n.data("dist_to_cur", value);
    }
    static toString(n: NodeSingular): string {
        return `Node ${n.id()}: distance = ${Node.getDistance(n)}, previous = ${
            Node.getPrevious(n)?.id() ?? "null"
        }, finalized = ${Node.isFinalized(n)}, distCur = ${
            Node.getDistToCur(n)
        }`;
    }
}

export function dijkstra(
    graph: Core,
    start: NodeSingular,
    end: NodeSingular,
): Array<NodeSingular> {
    const entdeckte: Set<NodeSingular> = new Set();
    entdeckte.add(start);
    // Initialize distances and previous nodes
    for (const node of graph.nodes()) {
        Node.setDistance(node, Infinity);
        Node.setPrevious(node, null);
        Node.setFinalized(node, false);
    }
    Node.setDistance(start, 0);
    // initially all nodes are in the queue
    while (entdeckte.size > 0) {
        // Find the node with the smallest distance
        console.log("Entdeckte Nodes Size:", entdeckte.size);
        const currentSmallest = Array.from(entdeckte).reduce((
            a,
            b,
        ) => (Node.getDistance(a) < Node.getDistance(b) ? a : b));
        if (currentSmallest === end) {
            console.log("Ende gefunden:", Node.toString(currentSmallest));
            break;
        }
        // currentNode is now the node with the smallest distance
        Node.setFinalized(currentSmallest);
        console.log(
            "Current Smallest entdeckte",
            Node.toString(currentSmallest),
        );
        console.log(
            "Starte Entdecken davon ausgehend",
        );
        for (const edge of currentSmallest.connectedEdges()) {
            const nachbar = edge.source() === currentSmallest
                ? edge.target()
                : edge.source();
            if (Node.isFinalized(nachbar)) continue;
            entdeckte.add(nachbar);
            Node.setDistToCur(nachbar, edge.data("weight"));
            console.log(
                "Nachbar:",
                Node.toString(nachbar),
            );
            // Update distances for neighbors
            const alt = Node.getDistance(currentSmallest) +
                Node.getDistToCur(nachbar);
            if (alt < Node.getDistance(nachbar)) {
                Node.setDistance(nachbar, alt);
                Node.setPrevious(nachbar, currentSmallest.id());
                console.log(
                    "UPDATE: ",
                    Node.toString(nachbar),
                );
            }
        }
        entdeckte.delete(currentSmallest);
        console.log("Abgeschlossen:", Node.toString(currentSmallest));
    }
    const path: NodeSingular[] = [];
    let currentEnd: NodeSingular | null = end;

    while (currentEnd) {
        console.log(
            "Return: Current End Node:",
            currentEnd.id(),
        );
        path.unshift(currentEnd); // pump it left into the array
        currentEnd = Node.getPrevious(currentEnd); // previous[currentNode];
    }

    return path.length > 1 ? path : [];
}
