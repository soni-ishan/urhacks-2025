// Search and location selection

let selectedLocation = null;

const searchInput = document.getElementById('searchInput');
const suggestionsDiv = document.getElementById('suggestions');

// Wait for DOM to be ready
if (searchInput && suggestionsDiv) {
    // Search input handler
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase();
        
        if (query.length < 2) {
            suggestionsDiv.style.display = 'none';
            return;
        }
        
        const matches = Object.keys(LOCATIONS).filter(function(name) {
            return name.toLowerCase().includes(query);
        });
        
        if (matches.length > 0) {
            suggestionsDiv.innerHTML = matches.map(function(name) {
                return '<div class="suggestion" onclick="selectLocation(\'' + name + '\')">' + name + '</div>';
            }).join('');
            suggestionsDiv.style.display = 'block';
        } else {
            suggestionsDiv.style.display = 'none';
        }
    });
    
    // Enter key handler
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-box')) {
            suggestionsDiv.style.display = 'none';
        }
    });
}

function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    const found = Object.keys(LOCATIONS).find(function(name) {
        return name.toLowerCase().includes(query);
    });
    
    if (found) {
        selectLocation(found);
    } else {
        alert('Location "' + query + '" not found');
    }
}

function selectLocation(name) {
    if (!map) {
        alert('Map is still loading...');
        return;
    }
    
    const location = LOCATIONS[name];
    map.setView(location.pos, 2);
    markers[name].openPopup();
    showLocationInfo(name, location);
    suggestionsDiv.style.display = 'none';
    searchInput.value = name;
    selectedLocation = { name: name, pos: location.pos, door: location.door, description: location.description };
}
