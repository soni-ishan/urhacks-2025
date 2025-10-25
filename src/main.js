// Import from our new firebase config
import { db, auth, graphDocRef, onSnapshot } from './firebaseConfig.js';
// Import our new dijkstra module
import { PriorityQueue, dijkstra } from './dijkstra.js';

// --- App State ---
let nodes = [];
let edges = [];
let shortestPath = [];

// --- DOM Elements ---
const canvas = document.getElementById('graph-canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');
const startSelect = document.getElementById('start-node');
const endSelect = document.getElementById('end-node');
const findPathBtn = document.getElementById('find-path-btn');
const instructions = document.getElementById('instructions');
const instructionText = document.getElementById('instruction-text');

const NODE_RADIUS = 8;
const backgroundImage = new Image();
backgroundImage.src = '/blueprint.png'; // Vite serves from 'public' folder

// --- NEW: Data Functions (Firestore) ---
function listenToGraph() {
    if (!graphDocRef) return;
    
    showMessage("Loading map data...", 'info');
    findPathBtn.disabled = true;
    
    onSnapshot(graphDocRef, (doc) => {
        if (doc.exists()) {
            const graphData = doc.data();
            nodes = graphData.nodes || [];
            edges = graphData.edges || [];
            
            nodes.forEach(node => {
                if (node.type === undefined) {
                    node.type = (node.name && (node.name.startsWith('Junction') || node.name.startsWith('junction'))) ? 'corridor' : 'room';
                }
                if (node.description === undefined) {
                    node.description = null;
                }
            });

            populateDropdowns();
            draw();
            hideError(); 
            findPathBtn.disabled = false;
        } else {
            showError("No map data found. Please ask an admin to create a map.");
        }
    }, (error) => {
        console.error("Error listening to graph:", error);
        showError("Error loading map data.");
    });
}


// --- Initialization ---
backgroundImage.onload = () => {
    container.style.aspectRatio = `${backgroundImage.naturalWidth} / ${backgroundImage.naturalHeight}`;
    resizeCanvas();
};

// --- Event Listeners ---
window.addEventListener('resize', resizeCanvas);
findPathBtn.addEventListener('click', () => {
    const startNodeId = parseInt(startSelect.value, 10);
    const endNodeId = parseInt(endSelect.value, 10);

    if (isNaN(startNodeId) || isNaN(endNodeId)) {
        showError("Please select both a start and end location.");
        return;
    }
    if (startNodeId === endNodeId) {
        showError("Start and end locations cannot be the same.");
        return;
    }
    
    hideError();
    
    const startNode = nodes.find(n => n.id === startNodeId);
    const endNode = nodes.find(n => n.id === endNodeId);

    if (!startNode || !endNode) {
        showError("Selected location data not found.");
        return;
    }

    calculateShortestPath(startNode, endNode);
    
    if (shortestPath.length > 0) {
        let startDesc = startNode.description ? ` (${startNode.description})` : '';
        let endDesc = endNode.description ? ` (${endNode.description})` : '';
        let message = `Path found from <b>${startNode.name}</b>${startDesc} to <b>${endNode.name}</b>${endDesc}.`;
        showMessage(message, 'info');
    }
    
    draw();
});


// --- Core Functions ---
function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    draw();
}

function populateDropdowns() {
    startSelect.innerHTML = '<option value="">Select starting point...</option>';
    endSelect.innerHTML = '<option value="">Select destination...</option>';

    const namedNodes = nodes
        .filter(node => node.type === 'room' && node.name && node.name.trim() !== "")
        .sort((a, b) => a.name.localeCompare(b.name));

    namedNodes.forEach(node => {
        const startOption = document.createElement('option');
        startOption.value = node.id;
        startOption.textContent = `${node.name}${node.description ? ` - ${node.description}` : ''}`;
        startSelect.appendChild(startOption);

        const endOption = document.createElement('option');
        endOption.value = node.id;
        endOption.textContent = `${node.name}${node.description ? ` - ${node.description}` : ''}`;
        endSelect.appendChild(endOption);
    });
}

function showError(message) {
    instructionText.innerHTML = message;
    instructions.style.display = 'block';
    instructions.classList.remove('bg-blue-50', 'border-blue-200', 'text-blue-700');
    instructions.classList.add('bg-red-50', 'border-red-200', 'text-red-700');
}

function showMessage(message, type = 'info') {
    instructionText.innerHTML = message;
    instructions.style.display = 'block';
    
    instructions.classList.remove('bg-blue-50', 'border-blue-200', 'text-blue-700', 'bg-red-50', 'border-red-200', 'text-red-700');
    
    if (type === 'error') {
        instructions.classList.add('bg-red-50', 'border-red-200', 'text-red-700');
    } else {
        instructions.classList.add('bg-blue-50', 'border-blue-200', 'text-blue-700');
    }
}

function hideError() {
    instructions.style.display = 'none';
    instructionText.innerHTML = '';
    instructions.classList.remove('bg-red-50', 'border-red-200', 'text-red-700');
    instructions.classList.add('bg-blue-50', 'border-blue-200', 'text-blue-700');
}

// --- Pathfinding Functions ---
function dist(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function getClosestPointOnSegment(p, p1, p2) {
    const px = p.x, py = p.y;
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return { x: x1, y: y1 };
    const t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    if (t < 0) return { x: x1, y: y1 };
    if (t > 1) return { x: x2, y: y2 };
    return { x: x1 + t * dx, y: y1 + t * dy };
}

function findClosestGraphPoint(node, corridorEdges, corridorNodes) {
    if (corridorEdges.length === 0) return null;

    let minDistance = Infinity;
    let bestPoint = null;
    let bestEdge = null;

    for (const edge of corridorEdges) {
        const nodeA = corridorNodes.find(n => n.id === edge.from);
        const nodeB = corridorNodes.find(n => n.id === edge.to);
        if (!nodeA || !nodeB) continue;

        const closestPointOnEdge = getClosestPointOnSegment(node, nodeA, nodeB);
        const d = dist(node, closestPointOnEdge);

        if (d < minDistance) {
            minDistance = d;
            bestPoint = closestPointOnEdge;
            bestEdge = edge;
        }
    }
    return { point: bestPoint, edge: bestEdge, distance: minDistance };
}

function addTempEdge(map, id1, id2, weight) {
    map.get(id1).push({ id: id2, weight });
    map.get(id2).push({ id: id1, weight });
}

function removeTempEdge(map, id1, id2) {
    map.set(id1, map.get(id1).filter(edge => edge.id !== id2));
    map.set(id2, map.get(id2).filter(edge => edge.id !== id1));
}

function buildWeightedEdgeList(corridorNodes, corridorEdges) {
    const graphEdges = new Map();
    const nodeCoords = new Map();

    corridorNodes.forEach(node => {
        graphEdges.set(node.id, []);
        nodeCoords.set(node.id, { x: node.x, y: node.y });
    });

    corridorEdges.forEach(edge => {
        const nodeA = nodeCoords.get(edge.from);
        const nodeB = nodeCoords.get(edge.to);
        if(nodeA && nodeB) {
            const weight = dist(nodeA, nodeB);
            addTempEdge(graphEdges, edge.from, edge.to, weight);
        }
    });

    return { graphEdges, nodeCoords };
}

function calculateShortestPath(startNode, endNode) {
    const corridorNodes = nodes.filter(n => n.type === 'corridor');
    const corridorNodeIds = new Set(corridorNodes.map(n => n.id));
    const corridorEdges = edges.filter(e => 
        corridorNodeIds.has(e.from) && corridorNodeIds.has(e.to)
    );

    if (corridorEdges.length === 0) {
        showError("No corridor path network has been defined by the admin.");
        shortestPath = [];
        return;
    }

    const { graphEdges, nodeCoords } = buildWeightedEdgeList(corridorNodes, corridorEdges);

    const startProj = findClosestGraphPoint(startNode, corridorEdges, corridorNodes);
    const endProj = findClosestGraphPoint(endNode, corridorEdges, corridorNodes);

    if (!startProj || !endProj) {
            showError("Could not find a connection to the corridor network.");
            shortestPath = [];
            return;
    }

    const tempStartNodeId = -1;
    const tempEndNodeId = -2;
    
    const { edge: startEdge, point: pStart } = startProj;
    const startA_id = startEdge.from;
    const startB_id = startEdge.to;
    removeTempEdge(graphEdges, startA_id, startB_id);
    graphEdges.set(tempStartNodeId, []);
    nodeCoords.set(tempStartNodeId, pStart);
    addTempEdge(graphEdges, startA_id, tempStartNodeId, dist(nodeCoords.get(startA_id), pStart));
    addTempEdge(graphEdges, startB_id, tempStartNodeId, dist(nodeCoords.get(startB_id), pStart));

    const { edge: endEdge, point: pEnd } = endProj;
    const endA_id = endEdge.from;
    const endB_id = endEdge.to;
    
    if (startEdge === endEdge) {
        graphEdges.set(tempEndNodeId, []);
        nodeCoords.set(tempEndNodeId, pEnd);
        addTempEdge(graphEdges, endA_id, tempEndNodeId, dist(nodeCoords.get(endA_id), pEnd));
        addTempEdge(graphEdges, endB_id, tempEndNodeId, dist(nodeCoords.get(endB_id), pEnd));
        addTempEdge(graphEdges, tempStartNodeId, tempEndNodeId, dist(pStart, pEnd));
    } else {
        removeTempEdge(graphEdges, endA_id, endB_id);
        graphEdges.set(tempEndNodeId, []);
        nodeCoords.set(tempEndNodeId, pEnd);
        addTempEdge(graphEdges, endA_id, tempEndNodeId, dist(nodeCoords.get(endA_id), pEnd));
        addTempEdge(graphEdges, endB_id, tempEndNodeId, dist(nodeCoords.get(endB_id), pEnd));
    }

    const pathNodeIds = dijkstra(graphEdges, nodeCoords, tempStartNodeId, tempEndNodeId);
    
    if (pathNodeIds.length === 0) {
            showError("A path could not be found between these locations.");
            shortestPath = [];
            return;
    }
    
    const pathPoints = pathNodeIds.map(id => nodeCoords.get(id));

    shortestPath = [startNode, ...pathPoints, endNode];
}

// --- Drawing Functions ---
function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (shortestPath.length >= 2) {
        // Only draw nodes and edges that are part of the shortest path
        drawRelevantEdges();
        drawRelevantNodes();
        drawShortestPath();
    } else {
        // Draw all nodes and edges when no path is selected
        drawEdges();
        drawNodes();
    }
}

function drawNodes() {
    nodes.forEach(node => {
        const color = node.type === 'room' ? '#22c55e' : '#ef4444'; 
        drawNode(node, color);
        
        if (node.type === 'room') {
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 14px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(node.name, node.x, node.y - NODE_RADIUS - 4);
        }
    });
}

function drawRelevantNodes() {
    if (shortestPath.length < 2) return;
    
    // Create a Set of nodes in the shortest path for efficient lookup
    const pathNodeIds = new Set(shortestPath.map(node => node.id));
    
    nodes.forEach(node => {
        if (pathNodeIds.has(node.id)) {
            const color = node.type === 'room' ? '#22c55e' : '#ef4444';
            drawNode(node, color);
            
            // Only draw labels for room nodes
            if (node.type === 'room') {
                ctx.fillStyle = '#1f2937';
                ctx.font = 'bold 14px Inter';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(node.name, node.x, node.y - NODE_RADIUS - 4);
            }
        }
    });
}

function drawNode(node, color) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawEdges() {
    ctx.strokeStyle = '#3b82f6'; 
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.5; 
    edges.forEach(edge => {
        const nodeFrom = nodes.find(n => n.id === edge.from);
        const nodeTo = nodes.find(n => n.id === edge.to);
        if (nodeFrom && nodeTo) {
            ctx.beginPath();
            ctx.moveTo(nodeFrom.x, nodeFrom.y);
            ctx.lineTo(nodeTo.x, nodeTo.y);
            ctx.stroke();
        }
    });
    ctx.globalAlpha = 1.0;
}

function drawRelevantEdges() {
    if (shortestPath.length < 2) return;
    
    ctx.strokeStyle = '#3b82f6'; 
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.5; 
    
    // Only draw edges that connect nodes in the shortest path
    for (let i = 0; i < shortestPath.length - 1; i++) {
        const currentNode = shortestPath[i];
        const nextNode = shortestPath[i + 1];
        
        ctx.beginPath();
        ctx.moveTo(currentNode.x, currentNode.y);
        ctx.lineTo(nextNode.x, nextNode.y);
        ctx.stroke();
    }
    
    ctx.globalAlpha = 1.0;
}

function drawShortestPath() {
    if (shortestPath.length < 2) return;

    ctx.strokeStyle = '#16a34a'; // green-600
    ctx.lineWidth = 5;
    ctx.setLineDash([10, 5]); 
    
    ctx.beginPath();
    ctx.moveTo(shortestPath[0].x, shortestPath[0].y);
    for (let i = 1; i < shortestPath.length; i++) {
        ctx.lineTo(shortestPath[i].x, shortestPath[i].y);
    }
    ctx.stroke();
    
    ctx.setLineDash([]); 
}

// --- Start Application ---
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User authenticated.");
        listenToGraph(); // Start listening *after* auth is confirmed
    }
});