
var Options = {
    isSetOptions: function() {
        return "undefined" !== typeof localStorage.options;
    },
    initOptions: function() {
        localStorage.options = JSON.stringify({});
    },
    getOption: function(name) {
        return JSON.parse(localStorage.options)[ name ];
    },
    setOption: function(name, value) {
        var options = JSON.parse(localStorage.options);
        options[ name ] = value;
        localStorage.options = JSON.stringify(options);
    }
};

function initOptionsIfNecessary() {
    if (!Options.isSetOptions()) {
        Options.initOptions();
    }

    if ("undefined" === typeof Options.getOption('is_enabled_proxy')) {
        Options.setOption('is_enabled_proxy', true);
    }

    if ("undefined" === typeof Options.getOption('notifications')) {
        Options.setOption('notifications', {"actual": [], "shown": []});
    }
}

function XHR(options) {

    var xhr = new XMLHttpRequest();

    var buildQueryString = function(obj, prefix) {
        var params = [];

        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                var key = prefix ? prefix + "[" + prop + "]" : prop;
                var value = obj[prop];
                params.push(
                    typeof value === "object"
                        ? buildQueryString(value, key)
                        : encodeURIComponent(key) + "=" + encodeURIComponent(value)
                );
            }
        }

        return params
            .filter(function(el) {
                return !!el;
            })
            .join("&");
    };

    var onSuccess = function() {
        if (options.onSuccess) {
            var response;

            try {
                response = JSON.parse(xhr.responseText);
            }
            catch (error) {
                response = {
                    response: xhr.responseText,
                    error: error
                };
            }

            options.onSuccess(response);
        }

        if (options.onComplete)
            options.onComplete();
    };

    var onFail = function() {
        if (options.onFail)
            options.onFail(xhr);

        if (options.onComplete)
            options.onComplete();
    };

    xhr.addEventListener("load", onSuccess, false);
    xhr.addEventListener("error", onFail, false);
    xhr.addEventListener("abort", onFail, false);
    xhr.addEventListener("timeout", onFail, false);

    options.method = options.method || "POST";

    xhr.open(
        options.method,
        options.url,
        true
    );

    if (options.method === "POST") {
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        options.data = buildQueryString(options.data);
    }

    xhr.timeout = options.timeout;
    xhr.send(options.data);
}

function createPac(server, proxy_hosts) {
    var host_matches = proxy_hosts.map(function(host) {
        return "shExpMatch(host, '" + host + "')";
    }).join(' || ');

    var protocol = ('http' === server.protocol)
        ? 'PROXY'
        : server.protocol.toUpperCase() ;

    var host = server.host;
    var port = parseInt(server.port, 10);
    var proxy = protocol + ' ' + host + ':' + port;

    return  "function FindProxyForURL(url, host) {" +
                "if ( " + host_matches + " ) {" +
                        "return '" + proxy + "';" +
                "}" +
                "return 'DIRECT';" +
            "}";
}

function isControllableProxySettings(details) {
    return details && details.hasOwnProperty('levelOfControl') && 'controllable_by_this_extension' === details.levelOfControl || 'controlled_by_this_extension' === details.levelOfControl;
}

function clearProxy() {
    chrome.proxy.settings.clear({scope:'regular'});
    console.log('Proxy has been cleared');
}

function applyProxy(config, proxyHosts) {
    /* callback hell :( */
    chrome.proxy.settings.set({value: config, scope: 'regular'}, function() {
        console.log('Proxy has been set');

        chrome.browsingData.removeCache({since:getOneDayAgoTimestamp()}, function() {
            console.log('Cache has been cleared');

            chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
                tabs.forEach(function(tab) {
                    if (tab.url && isProxyHost(tab.url, proxyHosts)) {
                        chrome.tabs.reload(tab.id);
                        console.log('Active tab has been reloaded');
                    }
                });
            });
        });
    });
}

function actualizeNotifications(newNotifications) {
    var isModified = false;
    var existingNotifications = Options.getOption('notifications');
    var actualNotificationIds = existingNotifications.actual.map(function (actualNotification) {
        return actualNotification.id;
    });
    var shownNotificationIds = existingNotifications.shown.map(function (shownNotification) {
        return shownNotification.id;
    });
    var newNotificationIds = newNotifications.map(function (newNotification) {
        return newNotification.id;
    });

    // delete
    existingNotifications.actual.forEach(function (existingNotification, i) {
        if (newNotificationIds.indexOf(existingNotification.id) === -1) {
            existingNotifications.actual.splice(i, 1);
            isModified = true;
        }
    });

    // add
    newNotifications.forEach(function (newNotification) {
        if (
            actualNotificationIds.indexOf(newNotification.id) === -1 &&
            shownNotificationIds.indexOf(newNotification.id) === -1
        ) {
            existingNotifications.actual.push({
                id: newNotification.id,
                message: newNotification.message,
                published_at: newNotification.date * 1000,
                shown_at: null
            });
            isModified = true;
        }
    });

    if (isModified) {
        existingNotifications.actual.sort(function (a, b) {
            return b.published_at - a.published_at;
        })
    }

    Options.setOption('notifications', existingNotifications);
}

function markNotificationAsShown(id) {
    var notifications = Options.getOption('notifications');

    notifications.actual.forEach(function (actualNotification, index) {
        if (actualNotification.id === id) {
            var shownNotificationIds = notifications.shown.map(function(shownNotification) {
                return shownNotification.id;
            });

            if (shownNotificationIds.indexOf(actualNotification.id) === -1) {
                actualNotification.shown_at = Date.now();
                notifications.shown.push(actualNotification);
            }

            notifications.actual.splice(index, 1);
        }
    });

    Options.setOption('notifications', notifications);
}

function isAvailableUpdate(current_v, actual_v) {
    return ('string' === typeof current_v && 'string' === typeof actual_v && current_v && actual_v && current_v < actual_v);
}

function hasActualNotifications() {
    return Options.getOption('notifications').actual.length > 0;
}

function setProblemIcon() {
    chrome.browserAction.setBadgeText({"text":"?"});
    chrome.browserAction.setBadgeBackgroundColor({"color":"red"});
    chrome.browserAction.setIcon({
        path: {
            19: "images/rutracker19.png",
            38: "images/rutracker38.png"
        }
    });
}

function setInactiveIcon() {
    chrome.browserAction.setBadgeText({"text":""});
    chrome.browserAction.setIcon({
        path: {
            19: "images/rutracker-inactive19.png",
            38: "images/rutracker-inactive38.png"
        }
    });
}

function setDefaultIcon() {
    chrome.browserAction.setBadgeText({"text":""});
    chrome.browserAction.setIcon({
        path: {
            19: "images/rutracker19.png",
            38: "images/rutracker38.png"
        }
    });
}

function getOneDayAgoTimestamp() {
    return (new Date()).getTime() - (1000 * 60 * 60 * 24 * 1);
}


function getHost(url) {
    //do not cut the port
    return url && url.match(/^https?:\/\//)
        ? url.replace(/^https?:\/\//, '').split(/[/?#]/)[0]
        : false;
}

function isProxyHost(url, proxyHosts) {
    var host = getHost(url);

    return host
        ? host.match(buildRegex(proxyHosts))
        : false;
}

function buildRegex(hosts) {
    var regex = [];

    hosts.forEach(function(host) {
        regex.push(host.replace(/^\*\./, '\\w+\\.'));
    });

    return new RegExp('^(?:' + regex.join('|') + ')$');
}

function formatDate(date_string) {
    return new Date(date_string).toLocaleString(
        'ru-RU',
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        }
    );
}
