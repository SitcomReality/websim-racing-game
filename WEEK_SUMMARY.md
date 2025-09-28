**Week Summary Screen**
- **Purpose**: Show week completion and overall standings
- **Elements**:
  - Week recap with all race results
  - Overall week standings/points
  - Earnings summary
  - Injuries/Progression (not implemented fully yet, but should be incorporated into the UI)
  - "Start New Week" button
- **Visual**: Newspaper/comic magazine layout

Create a beautiful Memphis design cartoon-style newspaper comic layout for the Week Summary Screen with modular components and newspaper-inspired styling.

Files to be updated/created:
- ui/screens/WeekSummaryScreen.js
- ui/components/WeekSummaryHeader.js
- ui/components/WeekRecapPanel.js
- ui/components/StandingsPanel.js
- ui/components/EarningsPanel.js
- styles/components/memphis/newspaper.css

These are some files to look at for context:
- /ui/screens/WeekSummaryScreen.js
- /ui/screens/WeekPreviewScreen.js
- /src/models/RaceWeek.js
- /styles/themes/memphis.css
- /styles/components/memphis/comic-elements.css

Steps:
1. Update the main WeekSummaryScreen.js (ui/screens/WeekSummaryScreen.js)
2. Create a new WeekSummaryHeader component (ui/components/WeekSummaryHeader.js)
3. Create a new WeekRecapPanel component (ui/components/WeekRecapPanel.js)
4. Create a new StandingsPanel component (ui/components/StandingsPanel.js)
5. Create a new EarningsPanel component (ui/components/EarningsPanel.js)
6. Create styles for the newspaper layout (styles/components/memphis/newspaper.css)
7. Update index.html to link the css and ui/index.js to connect the new scripts.