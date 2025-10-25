// Import from our new firebase config
import { db, auth, graphDocRef, setDoc, onSnapshot } from './firebaseConfig.js';

// --- App State ---
let mode = 'addCorridorNode';
let nodes = [];
let edges = [];
let currentNodeId = 0;
let edgeStartNode = null;
let isGraphLoaded = false;

const NODE_RADIUS = 8;
const HIT_RADIUS = 12;
const EDGE_HIT_RADIUS = 5;

// --- DOM Elements ---
const canvas = document.getElementById('graph-canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');
const addCorridorBtn = document.getElementById('add-corridor-btn');
const addRoomBtn = document.getElementById('add-room-btn');
const addEdgeBtn = document.getElementById('add-edge-btn');
const removeBtn = document.getElementById('remove-btn');
const clearBtn = document.getElementById('clear-btn');
const saveBtn = document.getElementById('save-graph-btn');
const instructionText = document.getElementById('instruction-text');

const backgroundImage = new Image();
backgroundImage.src = '/blueprint.png'; // Vite serves from 'public' folder

// --- Initialization ---
backgroundImage.onload = () => {
    container.style.aspectRatio = `${backgroundImage.naturalWidth} / ${backgroundImage.naturalHeight}`;
    resizeCanvas();
};

// --- Event Listeners ---
window.addEventListener('resize', resizeCanvas);
canvas.addEventListener('click', handleCanvasClick);
addCorridorBtn.addEventListener('click', () => setMode('addCorridorNode'));
addRoomBtn.addEventListener('click', () => setMode('addRoomNode'));
addEdgeBtn.addEventListener('click', () => setMode('addEdge'));
removeBtn.addEventListener('click', () => setMode('remove'));
clearBtn.addEventListener('click', clearGraph);
saveBtn.addEventListener('click', saveGraph);

// --- Core Functions (identical to before) ---

function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    draw();
}

function setMode(newMode) {
    mode = newMode;
    edgeStartNode = null; 

    addCorridorBtn.classList.toggle('btn-active', mode === 'addCorridorNode');
    addCorridorBtn.classList.toggle('bg-gray-300', mode !== 'addCorridorNode');
    addRoomBtn.classList.toggle('btn-active', mode === 'addRoomNode');
    addRoomBtn.classList.toggle('bg-gray-300', mode !== 'addRoomNode');
    addEdgeBtn.classList.toggle('btn-active', mode === 'addEdge');
    addEdgeBtn.classList.toggle('bg-gray-300', mode !== 'addEdge');
    removeBtn.classList.toggle('btn-active', mode === 'remove');
    removeBtn.classList.toggle('bg-gray-300', mode !== 'remove');

    if (mode === 'addCorridorNode') {
        instructionText.innerHTML = '<b>Mode:</b> Add Corridor Node. Click to add an auto-named junction point.';
    } else if (mode === 'addRoomNode') {
        instructionText.innerHTML = '<b>Mode:</b> Add Room Node. Click to add a room with a specific ID.';
    } else if (mode === 'addEdge') {
        instructionText.innerHTML = '<b>Mode:</b> Add Edge. Click a start corridor node, then an end corridor node.';
    } else if (mode === 'remove') {
        instructionText.innerHTML = '<b>Mode:</b> Remove. Click on a node or edge to delete it.';
    }
    draw();
}

function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    if (mode === 'addCorridorNode') {
        addCorridorNode(x, y);
    } else if (mode === 'addRoomNode') {
        addRoomNode(x, y);
    } else if (mode === 'addEdge') {
        handleAddEdge(x, y);
    } else if (mode === 'remove') {
        handleRemove(x, y);
    }

    draw();
}

function addCorridorNode(x, y) {
    const name = `Junction-${currentNodeId}`;
    const newNode = { 
        id: currentNodeId++, 
        x, 
        y, 
        name, 
        type: 'corridor', 
        description: null 
    };
    nodes.push(newNode);
}

function addRoomNode(x, y) {
    const name = prompt("Enter Room ID (e.g., 148.1):", "");
    if (name === null || name.trim() === "") {
        return; 
    }
    
    const description = prompt("Enter optional room description (e.g., Professor's Office):", "");
    
    const newNode = { 
        id: currentNodeId++, 
        x, 
        y, 
        name: name.trim(), 
        type: 'room', 
        description: description || null
    };
    nodes.push(newNode);
}

function handleAddEdge(x, y) {
    const clickedNode = getNodeAt(x, y);

    if (!edgeStartNode) {
        if (clickedNode) {
            if (clickedNode.type !== 'corridor') {
                instructionText.innerHTML = '<b>Mode:</b> Add Edge. Can only start edges from a corridor node.';
                return;
            }
            edgeStartNode = clickedNode;
            instructionText.innerHTML = `<b>Mode:</b> Add Edge. Start node ${edgeStartNode.name} selected. Click a second corridor node or an edge.`;
        }
        return; 
    }
    
    if (clickedNode) {
        if (clickedNode.type !== 'corridor') {
            instructionText.innerHTML = '<b>Mode:</b> Add Edge. Can only connect to other corridor nodes. Click a start node...';
            edgeStartNode = null;
            return;
        }
        if (edgeStartNode.id !== clickedNode.id) {
            addEdge(edgeStartNode, clickedNode);
        }
        edgeStartNode = null;
        instructionText.innerHTML = '<b>Mode:</b> Add Edge. Click a start corridor node...';
        return; 
    } 
    
    const clickedEdge = getEdgeAt(x, y);
    if (clickedEdge) {
        const nodeFrom = nodes.find(n => n.id === clickedEdge.from);
        const nodeTo = nodes.find(n => n.id === clickedEdge.to);
        
        if (!nodeFrom || !nodeTo) {
            edgeStartNode = null;
            instructionText.innerHTML = '<b>Mode:</b> Add Edge. Click a start corridor node...';
            return; 
        }
        if (edgeStartNode.id === nodeFrom.id || edgeStartNode.id === nodeTo.id) {
            edgeStartNode = null;
            instructionText.innerHTML = '<b>Mode:</b> Add Edge. Click a start corridor node...';
            return;
        }

        const closestPoint = getClosestPointOnSegment(edgeStartNode, nodeFrom, nodeTo);
        
        const name = `Junction-${currentNodeId}`;
        const newNode = { 
            id: currentNodeId++, 
            x: closestPoint.x, 
            y: closestPoint.y, 
            name, 
            type: 'corridor',
            description: null
        };
        
        nodes.push(newNode);
        removeEdge(clickedEdge);
        addEdge(edgeStartNode, newNode);
        addEdge(nodeFrom, newNode);
        addEdge(nodeTo, newNode);
        edgeStartNode = null;
        instructionText.innerHTML = '<b>Mode:</b> Add Edge. Click a start corridor node...';
        return;
    }

    edgeStartNode = null;
    instructionText.innerHTML = '<b>Mode:</b> Add Edge. Click a start corridor node...';
}

function addEdge(node1, node2) {
    const exists = edges.some(edge =>
        (edge.from === node1.id && edge.to === node2.id) ||
        (edge.from === node2.id && edge.to === node1.id)
    );
    if (!exists) {
        edges.push({ from: node1.id, to: node2.id });
    }
}

function getNodeAt(x, y) {
    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
        if (dist < HIT_RADIUS) {
            return node;
        }
    }
    return null;
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

function getEdgeAt(x, y) {
    for (const edge of edges) {
        const nodeFrom = nodes.find(n => n.id === edge.from);
        const nodeTo = nodes.find(n => n.id === edge.to);
        if (!nodeFrom || !nodeTo) continue;
        const clickPoint = { x, y };
        const edgeStart = { x: nodeFrom.x, y: nodeFrom.y };
        const edgeEnd = { x: nodeTo.x, y: nodeTo.y };
        const closestPoint = getClosestPointOnSegment(clickPoint, edgeStart, edgeEnd);
        const dist = Math.sqrt((x - closestPoint.x) ** 2 + (y - closestPoint.y) ** 2);
        if (dist < EDGE_HIT_RADIUS) {
            return edge;
        }
    }
    return null;
}

function handleRemove(x, y) {
    const clickedNode = getNodeAt(x, y);
    if (clickedNode) {
        if (confirm(`Are you sure you want to delete node "${clickedNode.name}"?`)) {
            removeNode(clickedNode);
        }
        return;
    }
    const clickedEdge = getEdgeAt(x, y);
    if (clickedEdge) {
        if (confirm("Are you sure you want to delete this edge?")) {
            removeEdge(clickedEdge);
        }
    }
}

function removeNode(nodeToRemove) {
    nodes = nodes.filter(node => node.id !== nodeToRemove.id);
    edges = edges.filter(edge => edge.from !== nodeToRemove.id && edge.to !== nodeToRemove.id);
}

function removeEdge(edgeToRemove) {
    edges = edges.filter(edge => edge !== edgeToRemove);
}

function clearGraph() {
    if (confirm("Are you sure you want to clear the entire graph? This will save the empty graph immediately.")) {
        nodes = [];
        edges = [];
        currentNodeId = 0;
        edgeStartNode = null;
        setMode('addCorridorNode');
        draw();
        saveGraph(); // Save the cleared graph
    }
}

// --- Data Functions (Firestore) ---
async function saveGraph() {
    if (!graphDocRef) {
        console.error("Firestore not initialized.");
        instructionText.innerHTML = `<b>Error:</b> Not connected to database.`;
        return;
    }
    
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    
    try {
        const graphData = { nodes, edges, currentNodeId };
        await setDoc(graphDocRef, graphData); 
        
        instructionText.innerHTML = `<b>Success!</b> Graph saved to shared database. ${nodes.length} nodes, ${edges.length} edges.`;
    } catch (e) {
        console.error("Failed to save graph:", e);
        instructionText.innerHTML = `<b>Error:</b> Could not save graph. Check console.`;
    }
    
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Graph";
}

function listenToGraph() {
    if (!graphDocRef) return;
    
    instructionText.innerHTML = "Loading graph from database...";
    
    onSnapshot(graphDocRef, (doc) => {
        if (doc.exists()) {
            const graphData = doc.data();
            nodes = graphData.nodes || [];
            edges = graphData.edges || [];
            currentNodeId = graphData.currentNodeId || 0;
            
            nodes.forEach(node => {
                if (node.type === undefined) {
                    node.type = (node.name && (node.name.startsWith('Junction') || node.name.startsWith('junction'))) ? 'corridor' : 'room';
                }
                if (node.description === undefined) {
                    node.description = null;
                }
            });

            const maxId = nodes.reduce((max, n) => Math.max(max, n.id), -1);
            currentNodeId = Math.max(currentNodeId, maxId + 1);

            instructionText.innerHTML = `<b>Success!</b> Graph loaded from database. ${nodes.length} nodes, ${edges.length} edges.`;
            isGraphLoaded = true;
        } else {
            instructionText.innerHTML = `<b>Info:</b> No saved graph found. Ready to create a new one.`;
            isGraphLoaded = true;
        }
        draw();
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Graph";
    }, (error) => {
        console.error("Error listening to graph:", error);
        instructionText.innerHTML = "<b>Error:</b> Could not load graph from database.";
    });
}

// --- Drawing Functions (identical to before) ---
function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawEdges();
    drawNodes();

    if (mode === 'addEdge' && edgeStartNode) {
        drawNode(edgeStartNode, '#facc15'); // yellow-400
    }
}

function drawNodes() {
    nodes.forEach(node => {
        const color = node.type === 'room' ? '#22c55e' : '#ef4444'; 
        drawNode(node, color);
        
        ctx.fillStyle = '#1f2937'; 
        ctx.font = 'bold 14px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(node.name, node.x, node.y - NODE_RADIUS - 4);
        
        if (node.type === 'room' && node.description) {
            ctx.font = '12px Inter';
            ctx.fillStyle = '#4b5563'; 
            ctx.fillText(node.description, node.x, node.y + NODE_RADIUS + 14);
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
    ctx.strokeStyle = '#3b82f6'; // blue-500
    ctx.lineWidth = 3;
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
}

// --- Start Application ---
// Check if auth is ready before listening, though signIn is called in firebaseConfig
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("Admin authenticated.");
        listenToGraph(); // Start listening *after* auth is confirmed
    }
});
