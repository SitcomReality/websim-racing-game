const EventTargetPrototype = document.__proto__.__proto__.__proto__.__proto__;
const origAddEventListener = EventTargetPrototype.addEventListener;
EventTargetPrototype.addEventListener = function addEventListenerWrapper(type, listener) {
    if (typeof listener !== 'function') throw new Error('bad listener for ' + type);
    return origAddEventListener.apply(this, arguments);
};

document.addEventListener('DOMContentLoaded', function() {
    function waitForWordlists() {
        if (!window.racerNamePrefixes || !window.racerNameSuffixes) {
            setTimeout(waitForWordlists, 100);
            return;
        }
        
        SettingsPanel.refresh();
        Tabs.initialize();
        EventHandlers.initializeAll();
    }
    
    waitForWordlists();
});

window.initializeUI = function() {
    SettingsPanel.refresh();
    Tabs.initialize();
    EventHandlers.initializeAll();
};

