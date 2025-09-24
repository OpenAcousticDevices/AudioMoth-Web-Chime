/****************************************************************************
 * map.js
 * openacousticdevices.info
 * February 2024
 *****************************************************************************/

/* global L */

let map, marker;

const mapRow = document.getElementById('map-row');
const mapContainer = document.getElementById('map-container');

const locationSwitch = document.getElementById('location-switch');
const latLabel = document.getElementById('lat-label');
const lonLabel = document.getElementById('lon-label');

const currentLocationLink = document.getElementById('current-location-link');
const disabledCurrentLocationLink = document.getElementById('disabled-current-location-link');

let isFirstTime = true;
let mapHidden = false;

let userLatLng = { lat: 0, lng: 0 };

function isLocationEnabled () {

    return locationSwitch.checked;

}

function setLocationEnabled (enabled) {

    locationSwitch.checked = enabled;

}

function disableLocationSwitch () {

    locationSwitch.disabled = true;

}

function enableLocationSwitch () {

    locationSwitch.disabled = false;

}

function getLatLng () {

    if (marker) {

        return marker.getLatLng();

    } else {

        return {lat: 0, lng: 0};

    }

}

function convertToCoordinateArray (l) {

    while (l > 180) l -= 360;
    while (l < -180) l += 360;

    l = Math.round(100 * l);

    const positiveDirection = l >= 0;

    l = Math.abs(l);

    const degrees = Math.floor(l / 100);
    const hundredths = l % 100;

    return [degrees, hundredths, positiveDirection];

}


function updateMarkerPosition (latLng, zoom) {

    // Round latitude to 0.000001 and longitude to 0.000002 degrees
    latLng.lat = Math.round(latLng.lat * 1000000) / 1000000;
    latLng.lng = Math.round(latLng.lng / 0.000002) * 0.000002;

    updateLocationDisplay(latLng);

    userLatLng = latLng;

    if (mapHidden) {

        return;

    }

    marker.setLatLng(latLng);

    map.setView(latLng, zoom);

}

function updateLocationDisplay (latLng) {

    latLabel.textContent = `${Math.abs(latLng.lat).toFixed(6)}°${latLng.lat >= 0 ? 'N' : 'S'}`;
    lonLabel.textContent = `${Math.abs(latLng.lng).toFixed(6)}°${latLng.lng >= 0 ? 'E' : 'W'}`;

}

function addMarker () {

    marker.addTo(map); // Add the marker to the map

}

function removeMarker () {

    map.removeLayer(marker);

}

function enableMap() {

    latLabel.classList.remove('disabled-label'); // Enable lat label
    lonLabel.classList.remove('disabled-label'); // Enable lon label

    if (mapHidden) {

        return;

    }

    map.dragging.enable();
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
    addMarker();
    mapContainer.classList.remove('map-disabled'); // Remove grey tint

    currentLocationLink.style.display = 'block'; // Show current location link
    disabledCurrentLocationLink.style.display = 'none'; // Hide disabled current location link

}

function disableMap() {

    if (mapHidden) {

        return;

    }

    console.log('Disabling map interactions');

    map.dragging.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    removeMarker();
    mapContainer.classList.add('map-disabled'); // Add grey tint

    latLabel.classList.add('disabled-label'); // Disable lat label
    lonLabel.classList.add('disabled-label'); // Disable lon label

    currentLocationLink.style.display = 'none'; // Hide current location link
    disabledCurrentLocationLink.style.display = 'block'; // Show disabled current location link

}

function addListenerToLocationSwitch () {

    locationSwitch.addEventListener('change', (event) => {

        if (event.target.checked) {

            if (isFirstTime) {

                isFirstTime = false;

                if (navigator.geolocation) {

                    navigator.geolocation.getCurrentPosition((position) => {

                        const userLat = position.coords.latitude;
                        const userLon = position.coords.longitude;

                        enableMap();

                        updateMarkerPosition({ lat: userLat, lng: userLon }, 13);

                    }, (error) => {

                        console.error('Error fetching location:', error);

                        enableMap();

                        updateMarkerPosition({ lat: 0, lng: 0 }, 2);

                    });

                } else {

                    console.error('Geolocation is not supported by this browser.');

                    enableMap();
                    
                    updateMarkerPosition({ lat: 0, lng: 0 }, 2);

                }

            } else {

                enableMap();

            }

        } else {

            console.log('Location switch toggled off');

            disableMap();

        }

    });

}

function showMap () {

    mapHidden = false;
    mapRow.style.display = '';

}

function hideMap () {

    mapHidden = true;
    mapRow.style.display = 'none';

}

function setUpMap () {

    try {

        map = new L.Map('map-div', {
            center: [0, 0], // Set initial center of the map
            zoom: 2 // Set initial zoom level
        });

    } catch (e) {

        console.log(e);

    }

    mapHidden = false;

    const attributionElement = document.getElementsByClassName('leaflet-control-attribution')[0];
    attributionElement.innerHTML = '<span>Open Street Map</span>';

    map.doubleClickZoom.disable();

    map.on('dblclick', (e) => {

        const latLng = e.latlng;
        const zoom = Math.min(map.getZoom() + 1, map.getMaxZoom());

        console.log('Map marker moved to ' + latLng + ' zoom ' + zoom);

        updateMarkerPosition(latLng);

    });

    const osm = new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 1,
        maxZoom: 17,
        attribution: ''
    });

    map.addLayer(osm);

    marker = new L.marker([0, 0], {draggable: true}); // Initialize the marker

    marker.on('dragend', (e) => {
        const latLng = e.target.getLatLng();
        console.log('Map marker moved to ' + latLng);
        updateLocationDisplay(latLng);
        map.setView(latLng);
    });

    currentLocationLink.addEventListener('click', (event) => {

        event.preventDefault();

        if (navigator.geolocation) {

            navigator.geolocation.getCurrentPosition((position) => {

                const userLat = position.coords.latitude;
                const userLon = position.coords.longitude;

                updateMarkerPosition({ lat: userLat, lng: userLon }, 13);

            }, (error) => {

                console.error('Error fetching location:', error);

            });

        } else {

            console.error('Geolocation is not supported by this browser.');

        }

    });

}
