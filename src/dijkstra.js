// This file exports the pathfinding logic so it can be shared.

export class PriorityQueue {
    constructor() { this.elements = []; }
    enqueue(element, priority) {
        this.elements.push({ element, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }
    dequeue() { return this.elements.shift(); }
    isEmpty() { return this.elements.length === 0; }
}

export function dijkstra(graphEdges, nodeCoords, startNodeId, endNodeId) {
    const distances = new Map();
    const previous = new Map();
    const pq = new PriorityQueue();
    
    nodeCoords.forEach((_, id) => {
        distances.set(id, Infinity);
        previous.set(id, null);
    });

    distances.set(startNodeId, 0);
    pq.enqueue(startNodeId, 0);

    while (!pq.isEmpty()) {
        const { element: currentNodeId } = pq.dequeue();
        
        if (currentNodeId === endNodeId) break;

        if (!graphEdges.has(currentNodeId)) continue;

        graphEdges.get(currentNodeId).forEach(neighbor => {
            const newDist = distances.get(currentNodeId) + neighbor.weight;
            if (newDist < distances.get(neighbor.id)) {
                distances.set(neighbor.id, newDist);
                previous.set(neighbor.id, currentNodeId);
                pq.enqueue(neighbor.id, newDist);
            }
        });
    }

    const path = [];
    let current = endNodeId;
    while (current !== null) {
        path.unshift(current);
        if (!previous.has(current)) break;
        current = previous.get(current);
    }
    
    return (path[0] === startNodeId) ? path : [];
}
