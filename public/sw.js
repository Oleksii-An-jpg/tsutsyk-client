self.addEventListener('push', function (event) {
    if (!event.data) return

    const data = event.data.json()
    const options = {
        body: data.body,
        icon: data.icon || '/icon.png',
        badge: '/badge.png',
        vibrate: [100, 50, 100],
        // Notifications sharing a tag replace each other rather than stacking:
        // an all-clear should cancel the alert it is answering, not queue
        // underneath it. Without one, a dog reporting every minute during a
        // raid could leave a column of identical banners.
        tag: data.tag,
        data: {
            url: data.url || '/me',
            dateOfArrival: Date.now(),
        },
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', function (event) {
    event.notification.close()

    // Where the API asked us to go — an order, the map — resolved against
    // wherever this worker is actually served from. Hardcoding the origin
    // sent every notification on a preview deployment to production.
    const target = new URL(event.notification.data?.url || '/me', self.location.origin)

    event.waitUntil(
        clients
            .matchAll({type: 'window', includeUncontrolled: true})
            .then((windows) => {
                // Reuse a tab that is already open rather than piling up a new
                // one per notification.
                for (const client of windows) {
                    if (new URL(client.url).origin === target.origin && 'focus' in client) {
                        return client.focus().then((focused) =>
                            'navigate' in focused ? focused.navigate(target.href) : focused,
                        )
                    }
                }
                return clients.openWindow(target.href)
            }),
    )
})
