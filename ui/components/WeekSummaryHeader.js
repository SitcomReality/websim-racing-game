export class WeekSummaryHeader {
  constructor() {
    this.el = null;
  }

  create() {
    this.el = document.createElement('header');
    this.el.className = 'newspaper-header';
    
    this.el.innerHTML = `
      <div class="newspaper-masthead">
        <h1 class="newspaper-title">THE FERRET HERALD</h1>
        <div class="newspaper-subtitle">Weekly Racing Digest</div>
        <div class="newspaper-date" id="newspaperDate"></div>
      </div>
      <div class="newspaper-banner-ads">
        <div class="banner-ad">🏁 RACING NEWS 🏁</div>
      </div>
    `;
    
    return this.el;
  }

  updateDate(weekNumber) {
    const dateEl = this.el?.querySelector('#newspaperDate');
    if (dateEl) {
      dateEl.textContent = `Week ${weekNumber} Edition`;
    }
  }

  updateBannerAd(adText = '🏁 RACING NEWS 🏁') {
    const bannerEl = this.el?.querySelector('.banner-ad');
    if (bannerEl) {
      bannerEl.textContent = adText;
    }
  }

  setTitle(title = 'THE FERRET HERALD', subtitle = 'Weekly Racing Digest') {
    const titleEl = this.el?.querySelector('.newspaper-title');
    const subtitleEl = this.el?.querySelector('.newspaper-subtitle');
    
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
  }

  getElement() {
    return this.el;
  }
}

