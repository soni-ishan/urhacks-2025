// UI interactions and navigation

let currentLocation = null;

function showLocationInfo(name, data) {
    document.getElementById('locationName').textContent = name;
    document.getElementById('locationDesc').textContent = data.description;
    document.getElementById('infoPanel').classList.add('show');
    selectedLocation = { name: name, pos: data.pos, door: data.door, description: data.description };
}

function closeInfo() {
    document.getElementById('infoPanel').classList.remove('show');
}

function setCurrentLocation() {
    if (!map) {
        alert('Map is still loading. Please wait...');
        return;
    }
    
    alert('Click on the map to set your current location');
    
    map.once('click', function(e) {
        currentLocation = [e.latlng.lat, e.latlng.lng];
        
        if (currentLocationMarker) {
            map.removeLayer(currentLocationMarker);
        }
        
        currentLocationMarker = L.circleMarker(currentLocation, {
            radius: 12,
            fillColor: '#2196F3',
            color: 'white',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(map);
        
        currentLocationMarker.bindPopup('<b>📍 You are here</b>').openPopup();
        console.log('Current location set:', currentLocation);
    });
}

function navigateTo() {
    if (!map) {
        alert('Map is still loading...');
        return;
    }
    
    if (!selectedLocation || !currentLocation) {
        alert('Set your location and select a destination first!');
        return;
    }
    
    if (routeLine) {
        map.removeLayer(routeLine);
    }
    
    const path = findSmartPath(currentLocation, selectedLocation.name);
    
    routeLine = L.polyline(path, {
        color: '#2196F3',
        weight: 6,
        opacity: 0.9,
        dashArray: '15, 10',
        lineJoin: 'round'
    }).addTo(map);
    
    routeLine.bindPopup('Route to ' + selectedLocation.name);
    map.fitBounds(path, { padding: [80, 80], maxZoom: 2 });
    
    alert('🧭 Navigating to ' + selectedLocation.name + '!');
    console.log('Navigation path:', path);
}
