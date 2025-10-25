// Location data configuration
const LOCATIONS = {
    'Main Entrance': {
        pos: [820, 1695],
        door: [1112, 1685],
        description: 'Main building entrance',
        category: 'entrance'
    },
    'Conference Room': {
        pos: [1992, 1955],
        door: [1907, 2113],
        description: 'Meeting and conference space',
        category: 'meeting'
    },
    'Computer Lab': {
        pos: [1192, 3195],
        door: [1069, 3106],
        description: 'Computer lab with workstations',
        category: 'lab'
    },
    'Study Area': {
        pos: [696, 3243],
        door: [808, 3094],
        description: 'Quiet study space',
        category: 'study'
    }
};

// Map configuration
const MAP_CONFIG = {
    bounds: [[0, 0], [3024, 4032]],
    imagePath: 'assets/blueprint.png',  // Image in root folder
    minZoom: -2,
    maxZoom: 4,
    defaultZoom: 0
};
