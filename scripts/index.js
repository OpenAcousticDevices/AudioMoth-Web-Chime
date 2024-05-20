/****************************************************************************
 * index.js
 * openacousticdevices.info
 * December 2022
 *****************************************************************************/

/* global AudioMothChimeConnector */

let iphoneWarning;

let audioMothChimeConnector;

let timeLabel, timeZoneLabel;

let locationSwitchLabel, locationSwitch;
let latLabel, lonlabel;
let waitingLabel;

let chimeButton;

let locationDisabled = false;

let GREY_COLOUR = '#919191';
let WHITE_COLOUR = 'white';

let lat, lon;

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

    timeString += ' UTC';

    timeLabel.innerText = timeString;

    updateTimeZone();

    setTimeout(updateTime, 1000);

}

function showWaitingLabel () {

    waitingLabel.innerText = 'Acquiring current location';

}

function showLocationUnavailableLabel () {

    waitingLabel.innerText = 'Location is not available';

}

function hideLabels () {

    waitingLabel.innerText = '';

}

// Keep time zone UI updated

function calculateTimezoneOffsetMins () {

    const currentDate = new Date();
    return (-1 * currentDate.getTimezoneOffset());

}

function calculateTimezoneOffsetHours () {

    return (calculateTimezoneOffsetMins() / 60);

}

function getTimezoneText (localTime) {

    let timezoneText = 'UTC';

    if (localTime) {

        /* Offset is given as UTC - local time */

        const timezoneOffset = calculateTimezoneOffsetHours();

        const timezoneOffsetHours = Math.floor(timezoneOffset);
        const timezoneOffsetMins = Math.abs(timezoneOffset - timezoneOffsetHours) * 60;

        if (timezoneOffset !== 0) {

            if (timezoneOffset > 0) {

                timezoneText += '+';

            }

            timezoneText += timezoneOffsetHours;

            if (timezoneOffsetMins > 0) {

                timezoneText += ':' + timezoneOffsetMins;

            }

        }

    }

    return timezoneText;

}

function updateTimeZone () {

    let timeZoneText = 'Local Time: ';
    timeZoneText += getTimezoneText(true);

    timeZoneLabel.innerText = timeZoneText;

}

// Handle chime button event

function handleChime () {

    chimeButton.disabled = true;
    locationSwitch.disabled = true;

    let date;

    if (!locationSwitch.checked) {

        date = new Date();

        audioMothChimeConnector.playTime(date, undefined, undefined, () => {

            if (!locationDisabled) {

                locationSwitch.disabled = false;

            }

            chimeButton.disabled = false;

        });

    } else {

        date = new Date();

        if (validLocationReceived) {

            audioMothChimeConnector.playTime(date, lat, lon, () => {

                chimeButton.disabled = false;
                locationSwitch.disabled = false;

            });

        } else {

            if (!locationDisabled) {

                chimeButton.disabled = false;

            }

            disableLocationUI();

        }

    }

}

// Check which chime button to display

function checkMobile () {

    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {

        iphoneWarning.innerHTML = 'Adjust volume to 3/4 full and ensure<br>that silent mode is switched off.';

        setTimeout(() => {

            iphoneWarning.style.opacity = '0';

        }, 5000);

    } else {

        iphoneWarning.innerText = '';

    }

}

function updatePosition (position) {

    if (!locationSwitch.checked) {

        return;

    }

    latLabel.style.color = WHITE_COLOUR;
    lonLabel.style.color = WHITE_COLOUR;

    lat = position.coords.latitude;
    lon = position.coords.longitude;

    let latString = Math.abs(lat).toFixed(6);
    latString += '°';
    latString += lat >= 0 ? 'N' : 'S';

    let lonString = Math.abs(lon).toFixed(6);
    lonString += '°';
    lonString += lon >= 0 ? 'E' : 'W';

    // console.log('New position:', latString, lonString);

    latLabel.innerText = latString;
    lonLabel.innerText = lonString;

    setTimeout(() => {

        navigator.geolocation.getCurrentPosition((position) => {

            updatePosition(position);

        }, disableLocationUI);

    }, 1000);

}

function disableLocationUI () {

    latLabel.style.color = GREY_COLOUR;
    lonLabel.style.color = GREY_COLOUR;

    showLocationUnavailableLabel();

    locationSwitch.checked = false;
    locationSwitch.disabled = true;

    locationSwitchLabel.style.color = GREY_COLOUR;

    locationDisabled = true;

}

function handleLocationToggle () {

    if (locationSwitch.checked) {

        validLocationReceived = false;

        chimeButton.disabled = true;

        setTimeout(() => {

            if (!validLocationReceived && locationSwitch.checked) {

                showWaitingLabel();

            }

        }, 1000);

        navigator.geolocation.getCurrentPosition((position) => {

            validLocationReceived = true;

            hideLabels();

            updatePosition(position);

            chimeButton.disabled = false;

        }, () => {

            disableLocationUI();

            chimeButton.disabled = false;

        });

    } else {

        latLabel.style.color = GREY_COLOUR;
        lonLabel.style.color = GREY_COLOUR;

        chimeButton.disabled = false;

        hideLabels();

    }

}

function loadPage () {

    checkMobile();
    updateTime();

    locationSwitch.addEventListener('click', handleLocationToggle);

    chimeButton.addEventListener('click', handleChime);

}

window.addEventListener('load', () => {

    audioMothChimeConnector = new AudioMothChimeConnector();

    iphoneWarning = document.getElementById('iphone-warning');

    timeLabel = document.getElementById('time-label');
    timeZoneLabel = document.getElementById('time-zone-label');

    locationSwitchLabel = document.getElementById('location-switch-label');
    locationSwitch = document.getElementById('location-switch');
    latLabel = document.getElementById('lat-label');
    lonLabel = document.getElementById('lon-label');
    waitingLabel = document.getElementById('waiting-label');

    chimeButton = document.getElementById('chime-button');

    locationSwitch.checked = false;

    // Register service worker

    if (!('serviceWorker' in navigator)) {

        console.log('Service workers not supported');

        loadPage();

    } else {

        // Ensure service worker is updated

        navigator.serviceWorker.register('./worker.js?v=6').then(
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
