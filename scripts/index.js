/****************************************************************************
 * index.js
 * openacousticdevices.info
 * December 2022
 *****************************************************************************/

/* global AudioMothChimeConnector */
import {initialiseTzf} from './timeZone.js';
import {setUpMap, hideMap, showMap, isLocationChimeEnabled, disableLocationSwitch, getMarkerLatLng, enableLocationSwitch, locationSwitch} from './map.js';
import {getTimeZoneMode, getCustomTimeZoneOffsetString, getLocalTimeZoneString, getMapTimeZoneString, getSelectedTimeZoneOffsetMins} from './timeZoneSelection.js';

const mainContent = document.getElementById('main-content');

const iphoneWarning = document.getElementById('iphone-warning');

const timeRow = document.getElementById('time-row');
const locationRow = document.getElementById('location-row');

let audioMothChimeConnector;

const timeLabel = document.getElementById('time-label');
const timeZoneLabel = document.getElementById('time-zone-label');
const timeZoneLink = document.getElementById('time-zone-link');
const timeZoneHolder = document.getElementById('time-zone-holder');
const timeZoneMobileSpan = document.getElementById('time-zone-mobile-span');

const chimeButton = document.getElementById('chime-button');

const localTimeZoneModalLabel = document.getElementById('local-time-zone-modal-label');

const locationSwitchRow = document.getElementById('location-switch-row');
const locationSwitchLabel = document.getElementById('location-switch-label');

const latLabel = document.getElementById('lat-label');
const lonLabel = document.getElementById('lon-label');

const switchDiv = document.getElementById('switch-div');

// Keep time UI updated

function updateTime () {

    const currentDate = new Date();

    const hours = String(currentDate.getUTCHours()).padStart(2, '0');
    const mins = String(currentDate.getUTCMinutes()).padStart(2, '0');
    const secs = String(currentDate.getUTCSeconds()).padStart(2, '0');

    let timeString = hours;
    timeString += ':';
    timeString += mins;
    timeString += ':';
    timeString += secs;

    timeLabel.innerText = timeString + ' UTC';

    updateTimeZone();

    setTimeout(updateTime, 1000);

}

function updateTimeZone () {

    let timeZoneText = '';

    // Update label in modal
    const localTimeZoneText = getLocalTimeZoneString();
    localTimeZoneModalLabel.innerText = localTimeZoneText;

    // Update main label
    switch (getTimeZoneMode()) {

    case 'local':
        timeZoneText = localTimeZoneText;
        timeZoneLabel.innerText = 'Local Time Zone:';
        break;
    case 'map':
        timeZoneText = getMapTimeZoneString();
        timeZoneLabel.innerText = 'Map Time Zone:';
        break;
    case 'custom':
        timeZoneText = getCustomTimeZoneOffsetString();
        timeZoneLabel.innerText = 'Custom Time Zone:';
        break;

    }

    timeZoneLink.innerText = timeZoneText;
    timeZoneMobileSpan.innerText = timeZoneText;

}

// Handle chime button event

async function handleChime () {

    chimeButton.disabled = true;
    disableLocationSwitch();

    const date = new Date();

    const tzOffsetMinutes = getSelectedTimeZoneOffsetMins();

    if (!isLocationChimeEnabled()) {

        console.log('Chiming using timezone offset', tzOffsetMinutes);

        audioMothChimeConnector.playTime(date, tzOffsetMinutes, undefined, undefined, () => {

            enableLocationSwitch();
            chimeButton.disabled = false;

        });

    } else {

        const latLng = getMarkerLatLng();

        console.log('Chiming using timezone offset and location', tzOffsetMinutes, latLng.lat, latLng.lng);

        audioMothChimeConnector.playTime(date, tzOffsetMinutes, latLng.lat, latLng.lng, () => {

            chimeButton.disabled = false;
            locationSwitch.disabled = false;
            enableLocationSwitch();

        });

    }

}

function isMobile () {

    // Surface tablets should display the full map interface
    if (/Surface/i.test(navigator.userAgent)) {

        return false;

    }

    return /iPhone|iPod|Android/i.test(navigator.userAgent);

}

function isIOS () {

    return /iPhone|iPad|iPod/i.test(navigator.userAgent);

}

function isPortrait () {

    return window.screen.orientation.angle === 0 || window.screen.orientation.angle === 180;

}

function resizeElementsBasedOnOrientation () {

    console.log('Resizing elements based on orientation');

    if (!isMobile()) {

        return;

    }

    const width = window.screen.width;
    const height = window.screen.height;

    console.log('Window width:', width, 'height:', height);

    let thickness;
    const radius = window.innerWidth * 0.04 + 'px';

    if (isPortrait()) {

        console.log('Portrait');

        iphoneWarning.style.fontSize = (0.1 * width) + 'px';

        if (isIOS()) {

            iphoneWarning.innerHTML = 'Adjust volume to 3/4 full and ensure<br>that silent mode is switched off.';

        }

        timeLabel.style.fontSize = 0.2 * width + 'px';

        timeZoneHolder.style.fontSize = 0.1 * width + 'px';

        locationSwitchLabel.style.fontSize = 0.1 * width + 'px';

        latLabel.style.fontSize = 0.2 * width + 'px';
        latLabel.style.marginTop = '0px';

        lonLabel.style.fontSize = 0.2 * width + 'px';
        lonLabel.style.marginTop = '-25px';
        lonLabel.style.marginBottom = '-10px';

        let timeRowMarginTop = 'calc(40vh - 12vh';
        timeRowMarginTop += isIOS() ? ' - ' + iphoneWarning.offsetHeight + 'px)' : ')';
        timeRow.style.marginTop = timeRowMarginTop;
        timeRow.style.height = '12vh';

        locationRow.style.marginTop = height * 0.05 + 'px';
        locationRow.style.height = '15vh';

        thickness = window.innerWidth * 0.01 + 'px';

        chimeButton.style.setProperty('height', (height * 0.15) + 'px', 'important');
        chimeButton.style.fontSize = 0.1 * width + 'px';

    } else {

        console.log('Landscape');

        iphoneWarning.style.fontSize = (0.025 * width) + 'px';

        if (isIOS()) {

            iphoneWarning.innerHTML = 'Adjust volume to 3/4 full and ensure that silent mode is switched off.';

        }

        timeLabel.style.fontSize = 0.045 * width + 'px';
        timeZoneHolder.style.fontSize = 0.03 * width + 'px';

        locationSwitchRow.style.marginTop = '0px';
        locationSwitchLabel.style.fontSize = 0.03 * width + 'px';
        locationSwitch.style.marginTop = '0px';

        latLabel.style.fontSize = 0.04 * width + 'px';
        latLabel.style.marginTop = '0px';

        lonLabel.style.fontSize = 0.04 * width + 'px';
        lonLabel.style.marginTop = '-10px';
        lonLabel.style.marginBottom = '0px';

        timeRow.style.marginTop = isIOS() ? 0 : '5vh';
        timeRow.style.height = '27vh';

        locationRow.style.marginTop = height * 0.05 + 'px';
        locationRow.style.height = '35vh';

        switchDiv.style.height = '40px';

        thickness = window.innerWidth * 0.005 + 'px';

        chimeButton.style.setProperty('height', (height * 0.15) + 'px', 'important');
        chimeButton.style.fontSize = 0.03 * width + 'px';

    }

    document.querySelectorAll('.rounded-border').forEach(el => {

        el.style.setProperty('border-width', thickness, 'important');
        el.style.setProperty('border-radius', radius, 'important');

    });

    chimeButton.style.position = 'fixed';
    chimeButton.style.left = '50%';
    chimeButton.style.transform = 'translateX(-50%)';
    chimeButton.style.bottom = (window.innerHeight * 0.05) + 'px';
    chimeButton.style.zIndex = '1000';
    const parent = chimeButton.parentElement || document.body;
    const parentRect = parent.getBoundingClientRect();
    const widthPx = Math.round(parentRect.width) + 'px';
    // Align the fixed button to the parent's left edge and remove centering transform
    chimeButton.style.left = Math.round(parentRect.left) + 'px';
    chimeButton.style.transform = 'none';
    chimeButton.style.setProperty('width', widthPx, 'important');

}

window.addEventListener('orientationchange', () => {

    console.log('Orientation change');

    mainContent.style.opacity = '0';

    setTimeout(() => {

        resizeElementsBasedOnOrientation();

        mainContent.style.opacity = '1';

    }, 150);

});

async function loadPage () {

    console.log(navigator.userAgent);

    if (!isMobile()) {

        await initialiseTzf();

    }

    updateTime();

    chimeButton.addEventListener('click', handleChime);

    mainContent.style.opacity = '1';

    if (isMobile()) {

        console.log('Mobile device');

        hideMap();

        timeZoneMobileSpan.style.display = '';
        timeZoneLink.style.display = 'none';

        resizeElementsBasedOnOrientation();

    } else {

        console.log('Desktop device');

        checkWindowSize();

        iphoneWarning.style.display = 'none';
        timeRow.style.marginTop = '0';

        showMap();
        setUpMap();

    }

    if (isIOS()) {

        setTimeout(() => {

            iphoneWarning.style.opacity = '0';

        }, 5000);

    } else {

        iphoneWarning.innerText = '';

        chimeButton.innerText = 'PLAY CHIME';

    }

}

window.addEventListener('load', () => {

    audioMothChimeConnector = new AudioMothChimeConnector();

    // Register service worker

    if (!('serviceWorker' in navigator)) {

        console.log('Service workers not supported');

        loadPage();

    } else {

        // Ensure service worker is updated

        navigator.serviceWorker.register('./worker.js?v=7').then(
            () => {

                console.log('Service worker registered');

            },
            (err) => {

                console.error('Service worker registration failed', err);

            }

        );

        navigator.serviceWorker.ready.then(() => {

            console.log('Ready');

            loadPage();

        });

    }

});

function checkWindowSize () {

    if (isMobile()) {

        return;

    }

    const height = window.innerHeight;

    const mapDiv = document.getElementById('map-div');

    let timeFontSize;

    if (height < 1080) {

        timeFontSize = 50;

        switchDiv.style.height = '35px';
        chimeButton.style.height = '50px';

        timeRow.style.height = '120px';
        locationRow.style.height = '150px';

        timeZoneHolder.style.fontSize = '30px';

        mapDiv.style.height = 'calc(100vh - 430px)';

    } else {

        timeFontSize = 90;

        switchDiv.style.height = '70px';
        chimeButton.style.height = '70px';

        timeRow.style.height = '200px';
        locationRow.style.height = '250px';

        timeZoneHolder.style.fontSize = '40px';

        mapDiv.style.height = 'calc(100vh - 620px)';

    }

    timeLabel.style.fontSize = `${timeFontSize}px`;
    timeLabel.style.height = `${1.25 * timeFontSize}px`;
    timeZoneLabel.style.fontSize = `${timeFontSize / 2}px`;
    timeZoneLink.style.fontSize = `${timeFontSize / 2}px`;
    timeZoneMobileSpan.style.fontSize = `${timeFontSize / 2}px`;
    latLabel.style.fontSize = `${3 * timeFontSize / 4}px`;
    latLabel.style.height = `${(3 * timeFontSize / 4) + 10}px`;
    lonLabel.style.fontSize = `${3 * timeFontSize / 4}px`;
    lonLabel.style.height = `${(3 * timeFontSize / 4) + 10}px`;
    locationSwitchLabel.style.fontSize = `${timeFontSize / 2}px`;

}

window.addEventListener('resize', checkWindowSize);

export {updateTimeZone};
