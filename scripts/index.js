/****************************************************************************
 * index.js
 * openacousticdevices.info
 * December 2022
 *****************************************************************************/

/* global AudioMothChimeConnector */

let audioMothChimeConnector;

let timeHolder;

let iphoneWarning;

let timeLabel, timeZoneLabel;

let chimeButton;

// Keep time UI updated

function updateTime () {

    const currentDate = new Date();

    const hours = String(currentDate.getHours()).padStart(2, '0');
    const mins = String(currentDate.getMinutes()).padStart(2, '0');
    const secs = String(currentDate.getSeconds()).padStart(2, '0');

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

    const date = new Date();

    audioMothChimeConnector.playTime(date, () => {

        chimeButton.disabled = false;

    });

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

function loadPage () {

    // Start page

    checkMobile();
    updateTime();

    chimeButton.addEventListener('click', handleChime);

}

window.addEventListener('load', () => {

    audioMothChimeConnector = new AudioMothChimeConnector();

    timeHolder = document.getElementById('time-holder');

    iphoneWarning = document.getElementById('iphone-warning');

    timeLabel = document.getElementById('time-label');
    timeZoneLabel = document.getElementById('time-zone-label');

    chimeButton = document.getElementById('chime-button');

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
