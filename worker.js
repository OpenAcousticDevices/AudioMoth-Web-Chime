/****************************************************************************
 * worker.js
 * openacousticdevices.info
 * December 2022
 *****************************************************************************/

/* global self, caches */

const cacheName = 'audiomothchime-v1';

self.addEventListener('install', (e) => {

    console.log('Caching assets for offline use');

    e.waitUntil((async () => {

        const cache = await caches.open(cacheName);

        await cache.addAll(['./assets/favicon.png',
            './index.css',
            './index.html',
            './scripts/index.js',
            './scripts/audiomothchime_connector.js',
            './scripts/audiomothchime.js'
        ]);

    })());

});

self.addEventListener('fetch', (e) => {

    e.respondWith((async () => {

        const r = await caches.match(e.request);

        if (r) {

            return r;

        }

        const response = await fetch(e.request);
        const cache = await caches.open(cacheName);

        cache.put(e.request, response.clone());

        return response;

    })());

});

self.addEventListener('activate', (e) => {

    e.waitUntil(caches.keys().then((keyList) => {

        return Promise.all(keyList.map((key) => {

            if (key === cacheName) {

                return 0;

            }

            return caches.delete(key);

        }));

    }));

});
