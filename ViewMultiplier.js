// ==UserScript==
// @name         More Ore - View Multiplier
// @namespace    https://syns.studio/more-ore/
// @version      1.1
// @description  Shows the total multiplier of the item type and rarity in the item tooltip
// @author       123HD123
// @match        https://syns.studio/more-ore/
// @icon         https://syns.studio/more-ore/misc-tinyRock.22ef93dd.ico
// @grant        none
// ==/UserScript==

const MOD_NAME = "View Multiplier";
const MOD_STORAGE_DEFAULT = {
  listeners: {}
};

const typeMultiplier = {
    Cloth: -.03,
    Cardboard: -.03,
    Plastic: -.03,
    Leather: 0,
    Stone: .01,
    Iron: .03,
    Silver: .03,
    Gold: .03,
    Steel: .08,
    Platinum: .08,
    Diamond: .2,
    Titanium: .2,
    Adamantite: .2,
    Alien: .2
};
const rarityMultiplier = {
    common: 0,
    uncommon: .01,
    rare: .02,
    unique: .05,
    epic: .1,
    legendary: .2,
    mythic: .3
};

const multiplierLevel = {
    WORST: 0.97,
    BAD: 1.10,
    AVERAGE: 1.11,
    AVERAGE2: 1.13,
    GOOD: 1.40,
    BEST: 1.50
};

function getLevel(multiplier) {
    if (multiplier == multiplierLevel.WORST) return "WORST";
    if (multiplier <= multiplierLevel.BAD) return "BAD";
    if (multiplier == multiplierLevel.AVERAGE || multiplier == multiplierLevel.AVERAGE2) return "AVERAGE";
    if (multiplier <= multiplierLevel.GOOD) return "GOOD";
    if (multiplier == multiplierLevel.BEST) return "BEST";
}

window.mods = window.mods || {};

const Logger = Notification?.notify || console.log;
if (Object.keys(window.mods).includes(MOD_NAME))
    return Logger(
        "Warning: Mod named " + MOD_NAME + " has already been loaded",
        3
    );

window.mods[MOD_NAME] = window.mods[MOD_NAME] || MOD_STORAGE_DEFAULT;

const MOD_STORAGE = window.mods[MOD_NAME];

if (MOD_STORAGE.listeners != {})
    Object.keys(MOD_STORAGE.listeners)
    .forEach(
        type => MOD_STORAGE.listeners[type]
        .forEach(
            listener => listener.node.removeEventListener(type, listener.function)
        )
    );

document.addEventListener("DOMNodeInserted", insertMultiplierStat);
MOD_STORAGE.listeners.DOMNodeInserted = MOD_STORAGE.listeners.DOMNodeInserted || [];
MOD_STORAGE.listeners.DOMNodeInserted.append({
    type: "DOMNodeInserted",
    function: insertMultiplierStat,
    node: document
});

function insertMultiplierStat(e) {
    let node = e.relatedNode;
    if (node?.className?.includes("tooltip-wrapper")) {
        node.querySelectorAll(".tooltip-right")?.forEach(tooltip => {
            let itemName = tooltip.querySelector(".tooltip-item-name")?.children[1];
            if (itemName == undefined) return;
            if (tooltip.querySelector(".stat-multiplier") != null) return;
            let totalMultiplier = (1 + rarityMultiplier[itemName.className] + typeMultiplier[itemName.innerText.split(" ")[0]]).toFixed(2);
            if (isNaN(totalMultiplier)) return;
            let stat = document.createElement("p");
            stat.className = "stat-multiplier";
            stat.innerHTML = `Multiplier ${getLevel(totalMultiplier)} <span><span class="bold">x${totalMultiplier}</span> <span class="icons positive"></span></span>`;
            tooltip.querySelector(".item-stats")?.append(stat);
        });
    }
}