// ==UserScript==
// @name         More Ore - Auto Updater
// @namespace    https://syns.studio/more-ore/
// @version      1.6
// @description  Shows an alert when there's an update for the More Ore game, without having to refresh the page
// @author       123HD123
// @match        https://syns.studio/more-ore/
// @icon         https://syns.studio/more-ore/misc-tinyRock.22ef93dd.ico
// @require      https://raw.githubusercontent.com/123HD123/More-Ore-Mods/master/Notification%2B.js
// @grant        none
// ==/UserScript==
(function() {
    const MOD_NAME = "Auto Updater";
    const MOD_STORAGE_DEFAULT = {
        intervals: []
    };

    window.mods = window.mods || {};

    const Logger = NotificationPlus?.notify || console.log;
    if (Object.keys(window.mods).includes(MOD_NAME))
        return Logger(
            "Warning: Mod named " + MOD_NAME + " has already been loaded",
            3
        );

    NotificationPlus?.load(MOD_NAME);

    window.mods[MOD_NAME] = window.mods[MOD_NAME] || MOD_STORAGE_DEFAULT;

    const MOD_STORAGE = window.mods[MOD_NAME];
        
    if (MOD_STORAGE.intervals != [])
        MOD_STORAGE.intervals.forEach(interval => clearInterval(interval.id));

    const URL = "https://syns.studio/more-ore/";
    const scriptsFileRegex = /.*".*(scripts.*.js)"/m;
    var oldScriptsFile = document.body.innerHTML.match(scriptsFileRegex)[1];

    MOD_STORAGE.intervals.push({
        id: setInterval(httpGetAsync, 5 * 60 * 1000, URL, cb),
        function: httpGetAsync,
        arguments: [URL, cb]
    });

    function cb(res) {
        notify("Checking for updates...");
        let date = new Date();
        let stamp = `[${date.toTimeString().split(" ")[0]}] `;
        console.log(stamp + "Checking for new files...");
        let scriptsFile = res.match(scriptsFileRegex)[1];
        if (scriptsFile == oldScriptsFile) return console.log(stamp + "No new files.");
        oldScriptsFile = scriptsFile;
        httpGetAsync(URL + scriptsFile, sRes => {
            let date = new Date();
            let stamp = `[${date.toTimeString().split(" ")[0]}] `;
            console.log(stamp + "Checking for updates...");
            let versionRegex = /\)]={+'(.*?)':{'rel/;
            let version = sRes.match(versionRegex)[1].replace(" ", " ");
            if (document.querySelector(".version").innerText.replace("v. ", "") !== version) alert(`New version (refresh): ${version}`);
            else {
                console.log(stamp + "No updates found!");
                alert("Possible hotfix detected (small update with purely bugfixes)");
            }
        });
    }

    function httpGetAsync(theUrl, callback) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) callback(xmlHttp.responseText);
        }
        xmlHttp.open("GET", theUrl, true); // true for asynchronous
        xmlHttp.setRequestHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        xmlHttp.setRequestHeader("Pragma", "no-cache");
        xmlHttp.setRequestHeader("Expires", "0");
        xmlHttp.send(null);
    }
})();