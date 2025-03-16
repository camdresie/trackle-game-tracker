
// This file now serves as a barrel export file for all game stats related services
// This maintains backward compatibility so existing imports don't break

// Re-export all functions from the individual service files
export { getGameScores, addGameScore } from './scoreService';
export { getUserGameStats, getPlayedGames } from './statsService';
export { getTodaysGames } from './todayService';

// Re-export test helpers
export { addFriendTestScores } from './testScoreHelpers';
