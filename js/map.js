// Map initialization and marker creation

// GLOBAL variables - accessible from all files
let map;
let markers = {};
let currentLocationMarker = null;
let routeLine = null;

function initializeMap() {
    // Create map
    map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        zoom: MAP_CONFIG.defaultZoom
    });
    
    // Add blueprint overlay
    L.imageOverlay(MAP_CONFIG.imagePath, MAP_CONFIG.bounds).addTo(map);
    map.fitBounds(MAP_CONFIG.bounds);
    
    // Create location markers
    createLocationMarkers();
    
    console.log('✅ Map initialized');
    console.log('📍', Object.keys(LOCATIONS).length, 'locations loaded');
    console.log('🛤️', CORRIDOR_WAYPOINTS.length, 'waypoints loaded');
}

function createLocationMarkers() {
    Object.entries(LOCATIONS).forEach(([name, data]) => {
        // Main marker
        const marker = L.marker(data.pos).addTo(map);
        marker.bindPopup('<b>' + name + '</b><br>' + data.description);
        marker.on('click', function() { 
            showLocationInfo(name, data); 
        });
        markers[name] = marker;
        
        // Door marker
        L.circleMarker(data.door, {
            radius: 5,
            fillColor: '#4CAF50',
            color: 'white',
            weight: 2,
            fillOpacity: 0.8
        }).addTo(map).bindPopup('🚪 ' + name);
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMap);
} else {
    initializeMap();
}
