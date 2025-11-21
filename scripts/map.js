/****************************************************************************
 * map.js
 * openacousticdevices.info
 * February 2024
 *****************************************************************************/

/* eslint-disable new-cap */
/* global L */
import {getTimeZoneFromCoord} from './timeZone.js';
import {updateMapTimeZoneModalLabel} from './timeZoneSelection.js';
import {updateTimeZone} from './index.js';

const LATITUDE_PRECISION = 1000000;
const LONGITUDE_PRECISION = 500000;

let map, marker;
let zoomControls, userLocationButton;

let normalisedLocation = {lat: 0, lng: 0};

const mapRow = document.getElementById('map-row');
const mapContainer = document.getElementById('map-container');

const locationSwitch = document.getElementById('location-switch');
const latLabel = document.getElementById('lat-label');
const lonLabel = document.getElementById('lon-label');

let isFirstTimeOpeningMap = true;
let mapHidden = false;
let timeZoneLookupEnabled = false;

let mapTimeZone;

function setMapView (latLng, zoom) {

    if (!mapHidden) {

        map.setView(latLng, zoom);

    }

}

async function getTimeZoneForNormalisedLocation () {

    return await getTimeZoneFromCoord(normalisedLocation.lat, normalisedLocation.lng);

}

function isLocationChimeEnabled () {

    return locationSwitch.checked;

}

function disableLocationSwitch () {

    locationSwitch.disabled = true;

}

function enableLocationSwitch () {

    locationSwitch.disabled = false;

}

function getMarkerLatLng () {

    return normalisedLocation;

}

function setMarkerColour (m, colour) {

    const fill = colour || '#2f80ff';
    const size = 50;
    const html = `
        <div title="Marker" style="width: ${size}px; height: ${size}px; display: flex; align-items: flex-end; justify-content: center; transform: translateY(-4px);">
            <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${fill}" stroke="#ffffff" stroke-width="1"/>
                <circle cx="12" cy="9" r="2.5" fill="#ffffff" fill-opacity="0.9" stroke="#ffffff" stroke-width="0.8"/>
            </svg>
        </div>
    `;

    const icon = L.divIcon({
        className: 'audiomoth-default-pin audiomoth-custom-pin',
        html,
        iconSize: [size, size],
        iconAnchor: [Math.floor(size / 2), size]
    });

    m.setIcon(icon);

}

function roundAndNormaliseLatLng (latLng) {

    // Round latitude to 0.000001 and longitude to 0.000002 degrees
    latLng.lat = Math.round(latLng.lat * LATITUDE_PRECISION) / LATITUDE_PRECISION;
    latLng.lng = Math.round(latLng.lng * LONGITUDE_PRECISION) / LONGITUDE_PRECISION;

    return {lat: latLng.lat, lng: ((latLng.lng + 180) % 360 + 360) % 360 - 180};

}

function updateMarkerPosition (latLng) {

    if (!mapHidden) {

        marker.setLatLng(latLng);

    }

    normalisedLocation = roundAndNormaliseLatLng(latLng);

    updateLocationDisplay(normalisedLocation);

}

function updateLocationDisplay (latLng) {

    latLabel.textContent = `${Math.abs(latLng.lat).toFixed(6)}°${latLng.lat >= 0 ? 'N' : 'S'}`;
    lonLabel.textContent = `${Math.abs(latLng.lng).toFixed(6)}°${latLng.lng >= 0 ? 'E' : 'W'}`;

}

function enableMapInterface () {

    if (mapHidden) {

        return;

    }

    map.dragging.enable();
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
    setMarkerColour(marker, '#2f80ff');
    mapContainer.classList.remove('map-disabled'); // Remove grey tint

    setMapControlsEnabled(true);

}

function disableMap () {

    if (mapHidden) {

        return;

    }

    console.log('Disabling map interactions');

    map.dragging.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    setMarkerColour(marker, 'grey');
    mapContainer.classList.add('map-disabled'); // Add grey tint

    latLabel.classList.add('disabled-label'); // Disable lat label
    lonLabel.classList.add('disabled-label'); // Disable lon label

    setMapControlsEnabled(false);

}

function showMap () {

    mapHidden = false;
    mapRow.style.display = 'flex';

}

function hideMap () {

    mapHidden = true;
    mapRow.style.display = 'none';

}

function setMapControlsEnabled (enabled) {

    if (enabled) {

        zoomControls.classList.remove('disabled');
        userLocationButton.enable();

    } else {

        zoomControls.classList.add('disabled');
        userLocationButton.disable();

    }

}

function createMarker (latLng, colour) {

    const newMarker = L.marker([latLng.lat, latLng.lng], {
        draggable: true
    });

    setMarkerColour(newMarker, colour);

    return newMarker;

}

function setUpMap () {

    try {

        map = new L.Map('map-div', {
            center: [0, 0],
            zoom: 2
        });

        userLocationButton = L.easyButton('<img src="./assets/crosshair.svg" style="width: 12px; height: 12px; margin-bottom: 3px;">', async function () {

            if (!navigator.geolocation) {

                return;

            }

            navigator.geolocation.getCurrentPosition(async (position) => {

                const userLat = position.coords.latitude;
                const userLon = position.coords.longitude;
                const userLocation = {lat: userLat, lng: userLon};

                console.log('Moving marker to user position at:', userLat, userLon);

                updateMarkerPosition(userLocation);

                setMapView(userLocation, 13);

                if (timeZoneLookupEnabled) {

                    mapTimeZone = await getTimeZoneForNormalisedLocation();
                    updateMapTimeZoneModalLabel();

                }

            }, async (error) => {

                console.error('Error fetching location:', error);

            });

        });

        userLocationButton.addTo(map);

        zoomControls = document.getElementsByClassName('leaflet-control-zoom')[0];

        setMapControlsEnabled(false);

    } catch (e) {

        console.log(e);

    }

    mapHidden = false;

    const attributionElement = document.getElementsByClassName('leaflet-control-attribution')[0];
    attributionElement.innerHTML = '<span>Open Street Map</span>';

    map.doubleClickZoom.disable();

    map.on('dblclick', async (e) => {

        const latLng = e.latlng;

        const zoom = Math.min(map.getZoom() + 1, map.getMaxZoom());

        console.log('Map marker moved to ' + latLng + ' zoom ' + zoom);

        updateMarkerPosition(latLng);

        setMapView(latLng, zoom);

        mapTimeZone = await getTimeZoneForNormalisedLocation();
        updateMapTimeZoneModalLabel();

        if (timeZoneLookupEnabled) {

            updateTimeZone();

        }

        updateLocationDisplay(normalisedLocation);

    });

    const osm = new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 1,
        maxZoom: 19,
        attribution: ''
    });

    map.addLayer(osm);

    marker = createMarker({lat: 0, lng: 0}, 'grey');

    marker.on('dragend', async (e) => {

        const latLng = e.target.getLatLng();

        console.log('Map marker moved to ' + latLng);

        updateMarkerPosition(latLng);

        setMapView(latLng);

        mapTimeZone = await getTimeZoneForNormalisedLocation();
        updateMapTimeZoneModalLabel();

        if (timeZoneLookupEnabled) {

            updateTimeZone();

        }

        updateLocationDisplay(normalisedLocation);

    });

    marker.addTo(map);

}

async function setTimeZoneLookupEnabled (enabled) {

    if (enabled === timeZoneLookupEnabled) {

        return;

    }

    if (enabled) {

        timeZoneLookupEnabled = true;

        enableMap();

    } else {

        timeZoneLookupEnabled = false;

        if (!locationSwitch.checked) {

            disableMap();

        }

    }

}

async function setMapMarkerToDefault () {

    updateMarkerPosition({lat: 0, lng: 0});

    setMapView({lat: 0, lng: 0}, 2);

    if (timeZoneLookupEnabled) {

        mapTimeZone = await getTimeZoneForNormalisedLocation();
        updateTimeZone();
        updateMapTimeZoneModalLabel();

    }

}

async function enableMap () {

    enableMapInterface();

    if (isFirstTimeOpeningMap) {

        isFirstTimeOpeningMap = false;

        if (navigator.geolocation) {

            navigator.geolocation.getCurrentPosition(async (position) => {

                const userLat = position.coords.latitude;
                const userLon = position.coords.longitude;

                updateMarkerPosition({lat: userLat, lng: userLon});

                setMapView({lat: userLat, lng: userLon}, 13);

                if (timeZoneLookupEnabled) {

                    console.log('Fetching time zone for user location...');

                    mapTimeZone = await getTimeZoneForNormalisedLocation();
                    updateMapTimeZoneModalLabel();

                }

            }, async (error) => {

                console.error('Error fetching location:', error);

                await setMapMarkerToDefault();

            });

        } else {

            console.error('Geolocation is not supported by this browser.');

            await setMapMarkerToDefault();

        }

    } else {

        if (timeZoneLookupEnabled) {

            console.log('Fetching time zone for marker location...');

            mapTimeZone = await getTimeZoneForNormalisedLocation();
            updateMapTimeZoneModalLabel();

        }

    }

}

locationSwitch.addEventListener('change', () => {

    if (locationSwitch.checked) {

        latLabel.classList.remove('disabled-label');
        lonLabel.classList.remove('disabled-label');

        locationSwitch.disabled = true;

        enableMap().then(() => {

            locationSwitch.disabled = false;

        });

    } else {

        latLabel.classList.add('disabled-label');
        lonLabel.classList.add('disabled-label');

        if (!timeZoneLookupEnabled) {

            disableMap();

        }

    }

});

function getMapTimeZone () {

    return mapTimeZone;

}

export {setUpMap, hideMap, showMap, isLocationChimeEnabled, disableLocationSwitch, getMarkerLatLng, enableLocationSwitch, locationSwitch, getMapTimeZone, setTimeZoneLookupEnabled};
