/** 
 * UIEvents - Centralized UI event definitions
 */
export const UIEvents = {
  // Game lifecycle events
  GAME_INITIALIZE: 'game:initialize',
  GAME_START: 'game:start',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_END: 'game:end',
  
  // Race events
  RACE_START_WEEK: 'race:startWeek',
  RACE_SETUP: 'race:setup',
  RACE_START: 'race:start',
  RACE_FINISH: 'race:finish',
  RACE_END: 'race:end',
  
  // Screen events
  SCREEN_CHANGED: 'screen:changed',
  SCREEN_HIDDEN: 'screen:hidden',
  
  // Betting events
  BETS_SUBMITTED: 'bets:submitted',
  BET_PLACED: 'bet:placed',
  BET_REMOVED: 'bet:removed',
  
  // UI component events
  COMPONENT_REFRESH: 'component:refresh',
  COMPONENT_UPDATE: 'component:update',
  
  // Settings events
  SETTINGS_CHANGED: 'settings:changed',
  SETTINGS_RESET: 'settings:reset'
};