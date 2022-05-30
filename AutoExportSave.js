// ==UserScript==
// @name         More Ore - Enhanced Save
// @namespace    https://syns.studio/more-ore/
// @version      1.0.0
// @description  Automatically tries to export save to a file every 1+ hours (customizable)
// @author       123HD123
// @match        https://syns.studio/more-ore/
// @icon         https://syns.studio/more-ore/misc-tinyRock.22ef93dd.ico
// @require      https://greasyfork.org/scripts/444840-more-ore-notification/code/More%20Ore%20-%20Notification+.user.js
// @grant        none
// ==/UserScript==
(function () {
    const MOD_NAME = "Enhanced Save";
    const MOD_ID = "enhancedSave";
    const MOD_STORAGE_DEFAULT = {
        intervals: [],
        mutationObservers: [],
        settings: [{
                id: "askBeforeExport",
                text: "Ask before trying to export",
                value: true,
                type: "checkbox"
            },
            {
                id: "exportInterval",
                text: "Export save every x amount of hours",
                value: 1,
                type: "range"
            }
        ]
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

    MOD_STORAGE.intervals = [];

    MOD_STORAGE.settings = JSON.parse(localStorage.getItem(`${MOD_ID}_settings`)) || MOD_STORAGE_DEFAULT.settings;
    
    localStorage.setItem(`${MOD_ID}_settings`, JSON.stringify(MOD_STORAGE.settings));
    
    if (MOD_STORAGE.settings.find(setting => setting.id == "exportInterval").value != -1)
        MOD_STORAGE.intervals.push(setInterval(requestExportSave, MOD_STORAGE.settings.find(setting => setting.id == "exportInterval")?.value * 60 * 60 * 1000));

    MOD_STORAGE.requestExportSave = requestExportSave;

    if (MOD_STORAGE.mutationObservers != [])
        MOD_STORAGE.mutationObservers.forEach(mutationObserver => mutationObserver.disconnect());
    
    MOD_STORAGE.mutationObservers = [];

    let m = new MutationObserver(onSettings);
    m.observe(document.querySelector(".page-container"), {childList: true});
    MOD_STORAGE.mutationObservers.push(m);

    m = new MutationObserver(onLoad);
    m.observe(document.body, {childList: true});

    function onLoad(mutationList, observer) {
        for(let mutation of mutationList) {
            if (mutation.removedNodes.keys().length == 0) return;
            let node = mutation.removedNodes.item(0);
            if (node?.className !== "loading-screen") return;

            // Get volume
            document.querySelector(".icon-settings")?.click();
            window.volume = Array.from(document.querySelectorAll(".setting-section")).find(setting => setting.children[0]?.innerText == "Volume").children[2].value;
            
            document.querySelector(".close-btn")?.click();
            observer.disconnect();
        }
    }
    //window.requestExportSave = requestExportSave;
    function requestExportSave() {
        if (MOD_STORAGE.settings.find(setting => setting.id == "askBeforeExport")?.value) {
            utils.confirmModal(
                MOD_NAME,
                "<p>Do you want to export your save to an external file?<br><span style='font-size: 13px;'>(TIP: the time between auto exports can be modified in the settings)</span></p>",
                exportSave,
                "Export", "Cancel",
                410,
                true,
                true);
        } else exportSave();
    }

    function exportSave() {
        document.querySelector(".save-game")?.click();
        // Array.from(document.querySelector(".save-row").children).find(child => child.innerText == "save game")?.click(); // Save game
        let save = localStorage.getItem("s"); // Get save

        // Download file
        let a = document.createElement("a");
        a.download = `MO - Auto Save ${utils.getTimeFormat()}.txt`;
        a.href = "data:plain/text;charset=utf-8," + save;
        a.click();
    }

    function onSettings(mutationList, observer) {
        for (let mutation of mutationList) {
            if (mutation.addedNodes.keys().length == 0) return;
            let node = mutation.addedNodes.item(0);
            if (!node?.className?.toLowerCase() == "modal-wrapper") return;

            // Insert elements
            if (node?.querySelector(".modal-settings")) {
                // Update volume
                let volumeBar = Array.from(document.querySelectorAll(".setting-section")).find(setting => setting.children[0]?.innerText == "Volume").children[2];
                window.volume = volumeBar.value;
                volumeBar.addEventListener("change", (event) => volume = event.target.value);
                
                insertSettings();
                modifyExportSave();
            } else if (node?.querySelector(".modal-importSave")) {
                insertUploadSave(node);
            }
        }
    }

    function insertSettings() {
        let settings = document.querySelector(".modal-settings");
        if (!settings) return;
        if (Array.from(document.querySelectorAll(".setting-section")).find(child => child.children[0]?.innerText == MOD_NAME)) return;
        let setting = document.createElement("div");
        setting.classList.add("setting-section");

        let settingTitle = document.createElement("h3");
        settingTitle.innerText = MOD_NAME;
        setting.append(settingTitle);

        for (let option of MOD_STORAGE.settings) {
            let settingOption = document.createElement("div");
            settingOption.classList.add("row");
            settingOption.innerHTML = `<p>${option.text}</p><input type='${option.type}'/>`;
            if (option.type == "range")
                settingOption.innerHTML = `<p>${option.text}</p><p>${option.value}</p>`;
            if (option.type == "checkbox")
                settingOption.children[1].checked = option.value;
            settingOption.children[1].onchange = e => {
                switch(option.type) {
                    case "checkbox":
                        option.value = e.target.checked;
                        break;
                    default:
                        option.value = e.target.value;
                };
                localStorage.setItem(`${MOD_ID}_settings`, JSON.stringify(MOD_STORAGE.settings));
            };
            setting.append(settingOption);

            if (option.type == "range") {
                let settingSlider = document.createElement("input");
                settingSlider.type = "range";
                settingSlider.min = "-1";
                settingSlider.max = "12";
                settingSlider.step = "1";
                settingSlider.value = option.value == .5 ? 0 : option.value;
                settingSlider.style.width = "100%";
                settingSlider.onchange = _ => {
                    settingOption.children[1].innerText = parseInt(settingSlider.value) || 0.5;
                    option.value = parseInt(settingSlider.value) || .5;
                    localStorage.setItem(`${MOD_ID}_settings`, JSON.stringify(MOD_STORAGE.settings));

                    clearInterval(MOD_STORAGE.intervals[0]);
                    MOD_STORAGE.intervals = [];
                    if (option.value == -1) return;
                    MOD_STORAGE.intervals.push(setInterval(requestExportSave, option.value * 60 * 60 * 1000));
                };
                setting.append(settingSlider);
            }
        }
        settings.querySelector(".modal-content").insertBefore(setting, Array.from(settings.querySelector(".modal-content").children).find(section => section.querySelector("h3")?.innerText == "Saves"));
    }

    function modifyExportSave() {
        let a = Array.from(document.querySelectorAll(".setting-section").values())
        .find(section => section.children[2]?.children[0]?.innerText == "export save")?.children[2].children[0];
        a.onclick = () => utils.choiceModal(
            MOD_NAME,
            "<p>Would you like to export to <b>file</b> or <b>clipboard</b>?</p>",
            {text: "Clipboard", callback: () => {
                Array.from(document.querySelector(".save-row").children).find(child => child.innerText == "save game")?.click(); // Save game
                navigator.clipboard.writeText(localStorage.getItem("s"));
            }},
            {text: "File", callback: exportSave},
            410,
            true);
    }

    function insertUploadSave(node) {
        if (node.querySelector("#file")) return;

        let button = document.createElement("button");
        button.className = "modal-action";
        button.style.padding = "0";

        let label = document.createElement("label");
        label.htmlFor = "file";
        label.style.cursor = "pointer";
        label.style.padding = "2px 8px";
        label.innerText = "Import File";

        button.append(label);

        let file = document.createElement("input");
        file.id = "file";
        file.type = "file";
        file.name = "file";
        file.className = "modal-action";
        file.style.display = "none";
        file.addEventListener('change', function() {
            var fr = new FileReader();
            fr.onload = function() {
                node.querySelector('.modal-content > textarea').innerText = fr.result;
            }

            fr.readAsText(this.files[0]);
        });
        document.querySelector(".modal-importSave > .modal-actions").insertBefore(file, document.querySelector(".modal-importSave > .modal-actions").children[1]);
        document.querySelector(".modal-importSave > .modal-actions").insertBefore(button, file);
    }

    const utils = {
        confirmModal: function (title, innerHTML, onConfirm) {
            //this.closeTopmostModal();
            var confirmMessage =
                arguments.length > 3 && void 0 !== arguments[3] ?
                arguments[3] :
                'Confirm',
                cancelMessage =
                arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : 'Cancel',
                customWidth = arguments.length > 5 ? arguments[5] : void 0,
                center = arguments.length > 6 ? arguments[6] : void 0,
                nonBlocking = arguments.length > 7 ? arguments[7] : void 0;
            let wrapper = this.createEl('div', ['modal-wrapper']);
            if (nonBlocking) {
                wrapper.style.margin = "auto";
                wrapper.style.width = "fit-content";
                wrapper.style.height = "fit-content";
                wrapper.style.background = "transparent";
            }
            wrapper.addEventListener('click', this.closeTopmostModal);
            var modal = this.createEl('div', [
                'modal'
            ]);
            customWidth && (modal.style.width = customWidth + 'px');
            center && (modal.style.textAlign = 'center');
            var titleElement = this.createEl('h2', ['modal-title'], title);
            modal.append(titleElement);
            var contentElement = this.createEl('div', ['modal-content']);
            contentElement.innerHTML = innerHTML;
            modal.append(contentElement);
            var actionsContainer = this.createEl('div', ['modal-actions']),
                confirmAction = this.createEl('button', ['modal-action'], confirmMessage);
            confirmAction.onclick = function () {
                this.closeTopmostModal();
                onConfirm();
            }.bind(this);
            var cancelAction = this.createEl('button', ['modal-action'], cancelMessage);
            cancelAction.onclick = function () {
                this.closeTopmostModal();
            }.bind(this);
            actionsContainer.append(cancelAction, confirmAction);
            modal.append(actionsContainer);
            wrapper.append(modal);
            document.querySelector(".page-container").append(wrapper);
        },
        choiceModal: function (title, innerHTML, leftButton, rightButton) {
            //this.closeTopmostModal();
            var leftMessage =
                leftButton.text,
                rightMessage =
                rightButton.text,
                customWidth = arguments.length > 4 ? arguments[4] : void 0,
                center = arguments.length > 5 ? arguments[5] : void 0;
            let wrapper = this.createEl('div', ['modal-wrapper']);
            wrapper.addEventListener('click', this.closeTopmostModal);
            var modal = this.createEl('div', [
                'modal'
            ]);
            customWidth && (modal.style.width = customWidth + 'px');
            center && (modal.style.textAlign = 'center');
            var titleElement = this.createEl('h2', ['modal-title'], title);
            modal.append(titleElement);
            var contentElement = this.createEl('div', ['modal-content']);
            contentElement.innerHTML = innerHTML;
            modal.append(contentElement);
            var actionsContainer = this.createEl('div', ['modal-actions']),
                leftAction = this.createEl('button', ['modal-action'], leftMessage);
            leftAction.onclick = function () {
                this.closeTopmostModal();
                leftButton.callback();
            }.bind(this);
            var rightAction = this.createEl('button', ['modal-action'], rightMessage);
            rightAction.onclick = function () {
                this.closeTopmostModal();
                rightButton.callback();
            }.bind(this);
            actionsContainer.append(rightAction, leftAction);
            modal.append(actionsContainer);
            wrapper.append(modal);
            document.querySelector(".page-container").append(wrapper);
        },
        createEl: function (tag) {
            var classes =
                arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : [],
                innerHTML =
                arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : '',
                element = document.createElement(tag);
            return (
                classes.forEach(function (clazz) {
                    return element.classList.add(clazz)
                }),
                (element.innerHTML = innerHTML + ''),
                element
            );
        },
        getCodeName: function (name) {
            return name
                .replace(/(?:^\w|[A-Z]|\b\w)/g, function (match, p1) {
                    return 0 === p1 ? match.toLowerCase() : match.toUpperCase()
                })
                .replace(/\s+/g, '')
                .replace(/\./g, '');
        },
        getTimeFormat: function() {
            let d = new Date();

            let dateString = d.toLocaleDateString().replaceAll("/", "-");

            let hours = d.getHours().toString().padStart(2, '0');
            let minutes = d.getMinutes().toString().padStart(2, '0');
            let seconds = d.getSeconds().toString().padStart(2, '0');

            return `${dateString}-${hours}.${minutes}.${seconds}`;
        },
        closeTopmostModal: function (event) {
            var targetElement;
            if (event) {
                var targetEl = event.target;
                targetElement = targetEl.classList.contains('modal-wrapper') ? targetEl : null;
            } else {
                var allWrappers = document.querySelectorAll('.modal-wrapper');
                allWrappers.length > 0 && (targetElement = allWrappers[allWrappers.length - 1]);
            }
            if (targetElement) {
                targetElement.style.pointerEvents = 'none';
                new Howl({
                    src: ['./sounds/misc.wav'],
                    volume: .1 * volume
                }).play();
                var modal = targetElement.children[0];
                modal.style.animation = 'fadeOutDown .15s ease-out forwards';
                modal.addEventListener('animationend', () => targetElement.parentNode.removeChild(targetElement));
            }
        }
    };
})();