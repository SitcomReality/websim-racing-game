export class TabsController {
  constructor(rootEl) { this.rootEl = rootEl; }
  initialize() {
    const btns = this.rootEl.querySelectorAll('.tab-button');
    const panels = this.rootEl.querySelectorAll('.tab-panel');
    btns.forEach(b => b.addEventListener('click', (e) => {
      const tab = e.currentTarget.getAttribute('data-tab');
      btns.forEach(x => x.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const target = this.rootEl.querySelector(`[data-tab-panel="${tab}"]`);
      if (target) target.classList.add('active');
    }));
  }
}

