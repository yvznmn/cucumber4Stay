var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    }
    else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    }
    else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};


//</editor-fold>

app.controller('ScreenshotReportController', function ($scope, $http) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
    }

    this.showSmartStackTraceHighlight = true;

    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };

    this.convertTimestamp = function (timestamp) {
        var d = new Date(timestamp),
            yyyy = d.getFullYear(),
            mm = ('0' + (d.getMonth() + 1)).slice(-2),
            dd = ('0' + d.getDate()).slice(-2),
            hh = d.getHours(),
            h = hh,
            min = ('0' + d.getMinutes()).slice(-2),
            ampm = 'AM',
            time;

        if (hh > 12) {
            h = hh - 12;
            ampm = 'PM';
        } else if (hh === 12) {
            h = 12;
            ampm = 'PM';
        } else if (hh === 0) {
            h = 12;
        }

        // ie: 2013-02-18, 8:35 AM
        time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

        return time;
    };


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };


    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };

    this.applySmartHighlight = function (line) {
        if (this.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return true;
    };

    var results = [
    {
        "description": "search1|smokeSuite",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 9208,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "DEBUG",
                "message": "https://4stay.com/ - [DOM] Input elements should have autocomplete attributes (suggested: \"current-password\"): (More info: https://goo.gl/9p2vKq) %o",
                "timestamp": 1545418446687,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 24:14643 \"[Facebook Pixel] - Duplicate Pixel ID: 217649548700528.\"",
                "timestamp": 1545418448639,
                "type": ""
            },
            {
                "level": "DEBUG",
                "message": "https://4stay.com/advanced_search?lat=15.199999&long=-86.24190499999997&place_title=Honduras&move_in=2018-12-22&move_out=2019-06-21&number_of_beds=1 - [DOM] Input elements should have autocomplete attributes (suggested: \"current-password\"): (More info: https://goo.gl/9p2vKq) %o",
                "timestamp": 1545418458709,
                "type": ""
            },
            {
                "level": "INFO",
                "message": "https://4stay.com/advanced_search?lat=15.199999&long=-86.24190499999997&place_title=Honduras&move_in=2018-12-22&move_out=2019-06-21&number_of_beds=1 83:16 \"send\" \"event\" \"Visitor\" \"Search\" \"\" \"\"",
                "timestamp": 1545418458756,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 24:14643 \"[Facebook Pixel] - Duplicate Pixel ID: 217649548700528.\"",
                "timestamp": 1545418458998,
                "type": ""
            }
        ],
        "screenShotFile": "images\\003e00be-0056-0072-005e-004800a2001b.png",
        "timestamp": 1545418450360,
        "duration": 4479
    },
    {
        "description": "invalidLogin|Regression Suite",
        "passed": true,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 9208,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "DEBUG",
                "message": "https://4stay.com/advanced_search?lat=15.199999&long=-86.24190499999997&place_title=Honduras&move_in=2018-12-22&move_out=2019-06-21&number_of_beds=1 - [DOM] Input elements should have autocomplete attributes (suggested: \"current-password\"): (More info: https://goo.gl/9p2vKq) %o",
                "timestamp": 1545418465793,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 24:14643 \"[Facebook Pixel] - Duplicate Pixel ID: 217649548700528.\"",
                "timestamp": 1545418466579,
                "type": ""
            },
            {
                "level": "DEBUG",
                "message": "https://4stay.com/ - [DOM] Input elements should have autocomplete attributes (suggested: \"current-password\"): (More info: https://goo.gl/9p2vKq) %o",
                "timestamp": 1545418466811,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00f50060-00ff-003b-003b-00ac000f002c.png",
        "timestamp": 1545418463453,
        "duration": 4380
    },
    {
        "description": "search1|Regression Suite",
        "passed": false,
        "pending": false,
        "os": "Windows NT",
        "instanceId": 9208,
        "browser": {
            "name": "chrome",
            "version": "71.0.3578.98"
        },
        "message": [
            "Expected false to be true."
        ],
        "trace": [
            "Error: Failed expectation\n    at arr.forEach.i (C:\\Users\\PC USER\\Desktop\\4Stay\\test\\spec.js:41:56)\n    at Array.forEach (<anonymous>)\n    at db.any.then.catch.then (C:\\Users\\PC USER\\Desktop\\4Stay\\test\\spec.js:29:17)\n    at <anonymous>\n    at process._tickCallback (internal/process/next_tick.js:189:7)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://4stay.com/users/sign_in - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1545418476851,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://4stay.com/users/sign_in - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1545418484271,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://4stay.com/users/sign_in - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1545418491883,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://4stay.com/users/sign_in - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1545418500035,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://4stay.com/users/sign_in - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1545418507338,
                "type": ""
            },
            {
                "level": "DEBUG",
                "message": "https://4stay.com/ - [DOM] Input elements should have autocomplete attributes (suggested: \"current-password\"): (More info: https://goo.gl/9p2vKq) %o",
                "timestamp": 1545418537673,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://4stay.com/users/sign_in - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1545418537673,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://4stay.com/users/sign_in - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1545418537673,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://4stay.com/users/sign_in - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1545418537674,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://4stay.com/users/sign_in - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1545418537674,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://4stay.com/users/sign_in - Failed to load resource: the server responded with a status of 401 ()",
                "timestamp": 1545418537674,
                "type": ""
            },
            {
                "level": "INFO",
                "message": "https://4stay.com/ 4 Active resource loading counts reached a per-frame limit while the tab was in background. Network requests will be delayed until a previous loading finishes, or the tab is brought to the foreground. See https://www.chromestatus.com/feature/5527160148197376 for more details",
                "timestamp": 1545418537696,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 24:14643 \"[Facebook Pixel] - Duplicate Pixel ID: 217649548700528.\"",
                "timestamp": 1545418539013,
                "type": ""
            },
            {
                "level": "DEBUG",
                "message": "https://4stay.com/ - [DOM] Input elements should have autocomplete attributes (suggested: \"current-password\"): (More info: https://goo.gl/9p2vKq) %o",
                "timestamp": 1545418539125,
                "type": ""
            },
            {
                "level": "DEBUG",
                "message": "https://4stay.com/advanced_search?lat=15.199999&long=-86.24190499999997&place_title=Honduras&move_in=2018-12-22&move_out=2019-06-21&number_of_beds=1 - [DOM] Input elements should have autocomplete attributes (suggested: \"current-password\"): (More info: https://goo.gl/9p2vKq) %o",
                "timestamp": 1545418544813,
                "type": ""
            },
            {
                "level": "INFO",
                "message": "https://4stay.com/advanced_search?lat=15.199999&long=-86.24190499999997&place_title=Honduras&move_in=2018-12-22&move_out=2019-06-21&number_of_beds=1 83:16 \"send\" \"event\" \"Visitor\" \"Search\" \"\" \"\"",
                "timestamp": 1545418545709,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://connect.facebook.net/en_US/fbevents.js 24:14643 \"[Facebook Pixel] - Duplicate Pixel ID: 217649548700528.\"",
                "timestamp": 1545418546184,
                "type": ""
            }
        ],
        "screenShotFile": "images\\001200b2-00fc-0031-0007-001800ee00a1.png",
        "timestamp": 1545418470682,
        "duration": 78947
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    }
                    else
                    {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.sortSpecs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.sortSpecs();
    }


});

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

