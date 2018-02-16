
function validateView(is_enabled) {

    function updateNotifications(notifications) {
        while (notifications_container.firstChild) {
            notifications_container.removeChild(notifications_container.firstChild);
        }

        notifications.forEach(function (notification) {
            notifications_container.appendChild(createSingleNotificationNode(notification));
        });
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
            chrome.runtime.sendMessage({
                "action" : "mark_notification_as_shown",
                "id": notification.id
            });
        };

        container = document.createElement("div");
        container.className = 'notification';
        container.dataset.id = notification.id;

        container.appendChild(date);
        container.appendChild(message);
        container.appendChild(deactivate);

        return container;
    }

    var controllable_block      = document.getElementById('not-controllable');
    var inform_icon             = document.getElementById('inform');
    var update_block            = document.getElementById('update-available');
    var notifications_block     = document.getElementById('notifications');
    var notifications_container = document.getElementById('notifications-list');

    if (!is_enabled) {
        inform_icon.style.display = 'inline-block';
        controllable_block.style.display = 'none';
        update_block.style.display = 'none';
        notifications_block.style.display = 'none';

        return;
    }

    inform_icon.style.display = 'none';

    chrome.runtime.sendMessage({"get": "current_state"}, function (response) {
        update_block.style.display = (response.is_available_update ? 'block' : 'none');
        controllable_block.style.display = (response.is_controllable_settings ? 'none' : 'block');
        notifications_block.style.display = (response.notifications.length ? 'block' : 'none');

        updateNotifications(response.notifications);
    });
}

(function($) {

    // Switcher
    $(document).ready(function() {
        $('input').lc_switch();

        var label = document.querySelector('#control .label .status');

        // On
        $('body').delegate('.lcs_check', 'lcs-on', function() {
            chrome.runtime.sendMessage({
                "set" : "is_enabled_proxy",
                "value": true
            });
            label.innerHTML = 'Плагин включен';
            label.style.color = 'green';
            validateView(true);
        });

        // Off
        $('body').delegate('.lcs_check', 'lcs-off', function() {
            chrome.runtime.sendMessage({
                "set" : "is_enabled_proxy",
                "value": false
            });
            label.innerHTML = 'Плагин выключен';
            label.style.color = 'red';
            validateView(false);
        });
    });

    // Check and set current switcher state
    chrome.runtime.sendMessage({ "get" : "is_enabled_proxy" }, function(response) {
        if (response.is_enabled_proxy) {
            $('.lcs_check').lcs_on();
        }
        else {
            $('.lcs_check').lcs_off();
        }
    });

})(jQuery);
