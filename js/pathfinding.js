// Pathfinding utilities

function calculateDistance(point1, point2) {
    const dy = point2[0] - point1[0];
    const dx = point2[1] - point1[1];
    return Math.sqrt(dx * dx + dy * dy);
}

function findSmartPath(startPos, destinationName) {
    const destination = LOCATIONS[destinationName];
    const destDoor = destination.door;
    const destPos = destination.pos;
    
    const path = [startPos];
    
    // Find nearest corridor point to start
    let nearestToStart = CORRIDOR_WAYPOINTS[0];
    let minDist = calculateDistance(startPos, nearestToStart);
    
    CORRIDOR_WAYPOINTS.forEach(function(waypoint) {
        const dist = calculateDistance(startPos, waypoint);
        if (dist < minDist) {
            minDist = dist;
            nearestToStart = waypoint;
        }
    });
    
    path.push(nearestToStart);
    
    // Find nearest corridor point to door
    let nearestToDoor = CORRIDOR_WAYPOINTS[0];
    minDist = calculateDistance(destDoor, nearestToDoor);
    
    CORRIDOR_WAYPOINTS.forEach(function(waypoint) {
        const dist = calculateDistance(destDoor, waypoint);
        if (dist < minDist) {
            minDist = dist;
            nearestToDoor = waypoint;
        }
    });
    
    if (nearestToDoor !== nearestToStart) {
        path.push(nearestToDoor);
    }
    
    path.push(destDoor);
    path.push(destPos);
    
    return path;
}
