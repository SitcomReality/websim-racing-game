class Tabs {
    static initialize() {
        const tabs = document.getElementById('sidebarTabs');
        if (tabs) {
            tabs.querySelectorAll('.tab-button').forEach(btn => {
                btn.addEventListener('click', () => {
                    tabs.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                    tabs.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                    btn.classList.add('active');
                    const id = btn.getAttribute('data-tab');
                    const panel = tabs.querySelector(`.tab-panel[data-tab-panel="${id}"]`);
                    if (panel) panel.classList.add('active');
                });
            });
        }
    }
}

window.Tabs = Tabs;

