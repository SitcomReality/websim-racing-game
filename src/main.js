import { Application } from './core/Application.js';

// Initialize and start the application
const app = new Application();
app.initialize().then(() => {
  console.log('Game initialized successfully');
  const moneyEl = document.getElementById('headerMoney');
  const settingsBtn = document.getElementById('headerSettingsBtn');
  const fmt = v => `$${(v ?? 0).toLocaleString()}`;
  const refreshMoney = () => { if (moneyEl) moneyEl.textContent = fmt(app.gameState.player.balance); };
  refreshMoney();
  app.eventBus.on('bet:placed', refreshMoney);
  app.eventBus.on('bets:settled', refreshMoney);
  app.eventBus.on('bet:cancelled', refreshMoney);
  app.eventBus.on('screen:changed', refreshMoney);
  settingsBtn?.addEventListener('click', () => {
    app.eventBus.emit('settings:open');
    console.log('Settings panel coming soon');
  });
}).catch(error => {
  console.error('Failed to initialize game:', error);
});

// Make app available globally for debugging
window.app = app;