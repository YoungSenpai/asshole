
(function() {

    var version = chrome.runtime.getManifest().version;
    var browserName = "chrome";
    var actualVersion = version;
    var isControllableSettings;
    var isEnabled = true;
    var validateDelay = 2 * 1000; //2 sec
    var checkNotificationsDelay = 1 * 60 * 10 * 1000; //10 min
    var validateInterval;
    var checkNotificationsInterval;

    var proxyHosts = [
        'rutracker.org',
        '*.rutracker.org',
        '*.rutracker.cc',
        '*.t-ru.org'
    ];

    // Default pac
    var config = {
        mode: "pac_script",
        pacScript: {
            data: createPac({
                protocol: 'https',
                host: 'rtk1.pass.xzvpn.net',
                port: 443
            }, proxyHosts)
        }
    };

    function processPlugin(forceReload) {
        if (isEnabled) {
            chrome.proxy.settings.get({incognito: false}, function(details) {
                var isControllableSettingsRuntime = isControllableProxySettings(details);

                if (forceReload || isControllableSettingsRuntime !== isControllableSettings) {
                    isControllableSettings = isControllableSettingsRuntime;
                    validatePopupIfOpened();
                    processIcon();

                    if (isControllableSettings) {
                        processProxy();
                    }
                }
            });
        }
        else {
            processIcon();
            clearProxy();
        }
    }

    function processNotifications() {
        XHR({
            method: "GET",
            url: "http://nrtk.rmcontrol.net/api/v1/",
            timeout: 2000,
            onSuccess: function(response) {
                if (response&& Array.isArray(response)) {
                    actualizeNotifications(response);
                }

                validatePopupIfOpened();
                processIcon();

                console.log('Notifications have been updated');
            },
            onFail: function() {
                console.log('Failed to load notifications');
            }
        });
    }

    function processProxy() {
        // Download remote configuration
        XHR({
            url: "https://rtk.rmcontrol.net",
            timeout: 2000,
            data: {
                api_version: 2,
                browser_name: browserName,
                plugin_version: version
            },
            onSuccess: function(response) {
                if (!response.error && response.protocol && response.host && response.port) {
                    config.pacScript.data = createPac(response, proxyHosts);
                    actualVersion = response.actual_plugin_version;

                    validatePopupIfOpened();
                    processIcon();
                }
            },
            onFail: function() {
                console.log('Failed to load remote configuration');
            },
            onComplete: function() {
                applyProxy(config, proxyHosts);
            }
        });
    }

    function processIcon() {
        if (!isEnabled) {
            setInactiveIcon();
        }
        else if (hasActualNotifications()) {
            setProblemIcon();
        }
        else if (!isControllableSettings) {
            setProblemIcon();
        }
        else if (isAvailableUpdate(version, actualVersion)) {
            setProblemIcon();
        }
        else {
            setDefaultIcon();
        }
    }

    function validatePopupIfOpened() {
        var popup = chrome.extension.getViews({type:"popup"})[0];

        if (popup) {
            popup.validateView(isEnabled);
            console.log('Popup has been validated');
        }
    }

    function enableTimers() {
        validateInterval = setInterval(processPlugin, validateDelay);
        checkNotificationsInterval = setInterval(processNotifications, checkNotificationsDelay);
    }

    function disableTimers() {
        clearInterval(validateInterval);
        clearInterval(checkNotificationsInterval);
    }

    // Register popup messages listener
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        /* getters */
        if ('is_enabled_proxy' === request.get) {
            sendResponse({
                is_enabled_proxy: isEnabled
            });
        }

        if ('current_state' === request.get) {
            sendResponse({
                is_enabled_proxy: isEnabled,
                is_available_update: isAvailableUpdate(version, actualVersion),
                is_controllable_settings: isControllableSettings,
                notifications: Options.getOption('notifications').actual.map(function (notification) {
                    notification.published_at = formatDate(notification.published_at);

                    return notification;
                })
            });
        }

        /* setters */
        if ('is_enabled_proxy' === request.set) {
            // if changed
            if (request.value !== isEnabled) {
                isEnabled = request.value;
                Options.setOption('is_enabled_proxy', isEnabled);

                disableTimers();
                processPlugin(true);

                if (isEnabled) {
                    processNotifications();
                    enableTimers();
                }
            }
        }

        if ('mark_notification_as_shown' === request.action) {
            markNotificationAsShown(request.id);
            validatePopupIfOpened();
            processIcon();
        }
    });

    initOptionsIfNecessary();
    isEnabled = Options.getOption('is_enabled_proxy');
    processPlugin();

    if (isEnabled) {
        processNotifications();
        enableTimers();
    }

})();
