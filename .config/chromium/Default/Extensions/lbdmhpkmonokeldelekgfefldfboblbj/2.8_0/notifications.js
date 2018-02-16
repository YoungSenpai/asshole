
(function() {

    var checkIsEnabledInterval;
    var divId = 'dostup-rutracker-notifications';
    var notificationsContainer = document.createElement("div");

    notificationsContainer.id = divId;
    document.body.appendChild(notificationsContainer);

    checkIsEnabledInterval = setInterval(checkIsEnabledProxy, 1000);

    function checkIsEnabledProxy() {
        try {
            chrome.runtime.sendMessage(
                null,
                {"get": "current_state"},
                null,
                function (response) {
                    if (response.is_enabled_proxy) {
                        updateNotifications(response.notifications);
                    }
                }
            );
        } catch (Error) {
            // Seems like ext was disabled. Forget about this tab.
            clearInterval(checkIsEnabledInterval);
            clearNotifications();
        }
    }

    function updateNotifications(notifications) {
        var pageNotifications = findPageNotifications();
        var pageNotificationIds = pageNotifications.map(function(notification) {
            return notification.dataset.id;
        });
        var notificationIds = notifications.map(function (notification) {
            return notification.id;
        });

        //clear shown
        pageNotifications.forEach(function (pageNotification) {
            if (notificationIds.indexOf(pageNotification.dataset.id) === -1) {
                pageNotification.parentNode.removeChild(pageNotification);
            }
        });

        //add actual
        notifications.forEach(function (notification) {
            if (pageNotificationIds.indexOf(notification.id) === -1) {
                notificationsContainer.insertBefore(
                    createSingleNotificationNode(notification),
                    notificationsContainer.firstChild
                );
            }
        });

    }

    function findPageNotifications() {
        return [].slice.call(document.querySelectorAll('#' + divId + ' .notification') || []);
    }

    function createSingleNotificationNode(notification) {
        var container, date, message, deactivate;

        date = document.createElement("div");
        date.className = 'date';
        date.innerHTML = notification.published_at;

        message = document.createElement("div");
        message.className = 'message';
        message.innerHTML = notification.message;

        deactivate = document.createElement("div");
        deactivate.className = 'deactivate';
        deactivate.innerHTML = 'Скрыть';
        deactivate.onclick = function () {
            chrome.runtime.sendMessage(
                null,
                {
                    "action" : "mark_notification_as_shown",
                    "id" : notification.id
                },
                null,
                function (response) {
                    container.parentNode.removeChild(container);
                }
            );
        };

        container = document.createElement("div");
        container.className = 'notification';
        container.dataset.id = notification.id;

        container.appendChild(date);
        container.appendChild(message);
        container.appendChild(deactivate);

        return container;
    }

    function clearNotifications() {
        findPageNotifications().forEach(function (pageNotification) {
            pageNotification.parentNode.removeChild(pageNotification);
        });
    }

})();
