# Code Efficiency Analysis Report

## High Priority Issues

### 1. N+1 Query Pattern in useHomeData Hook
**Location**: `src/hooks/useHomeData.ts`, lines 54-59  
**Impact**: High - Runs on every home page load  
**Issue**: The hook fetches user scores by looping through all games and making a separate database query for each game:

```typescript
for (const game of gamesList) {
  const gameScores = await getGameScores(game.id, user.id);
  allUserScores.push(...gameScores);
}
```

With ~17 games, this makes 17 sequential database calls instead of 1.

**Recommendation**: Replace with a single query that fetches all user scores at once, then group by game in memory.

**Estimated Performance Gain**: ~10-15x faster on home page load (1 query vs 17 queries)

**Status**: ✅ FIXED in this PR

## Medium Priority Issues

### 2. Duplicate Code Across Service Files
**Location**: `src/services/statsService.ts` and `src/services/gameStatsService.ts`  
**Impact**: Medium - Code maintenance burden  
**Issue**: Both files contain identical implementations of:
- `getPlayedGames()` function (lines 36-51 in statsService.ts, lines 166-184 in gameStatsService.ts)
- Similar patterns in other functions

**Recommendation**: Consolidate into a single service file to maintain DRY principles and reduce duplication.

**Status**: 🔴 Not fixed - recommend addressing in future PR

## Low Priority Issues

### 3. Wasteful useEffect in useLeaderboardData
**Location**: `src/hooks/leaderboard/useLeaderboardData.ts`, lines 79-85  
**Impact**: Low - Wasted CPU cycles  
**Issue**: useEffect filters data but never uses the computed results:

```typescript
useEffect(() => {
  const playersWithTodayScores = leaderboardData.filter(p => p.today_score !== null);
  
  if (timeFilter === 'today') {
    const playersInTodayView = filteredAndSortedPlayers.filter(p => p.today_score !== null);
  }
}, [leaderboardData, filteredAndSortedPlayers, timeFilter]);
```

The filtered arrays are computed but never used or returned.

**Recommendation**: Remove this useEffect entirely or add actual side effects if needed.

**Status**: 🔴 Not fixed - recommend addressing in future PR

### 4. Unnecessary Array Copy in processLeaderboardData
**Location**: `src/utils/leaderboard/processLeaderboardData.ts`, line 60  
**Impact**: Low - Extra memory allocation  
**Issue**: Creates array copy with `slice(0)` before sorting when in-place sort would suffice:

```typescript
const sortedScores = relevantScores.slice(0).sort((a, b) => ...);
```

**Recommendation**: Sort in place to save memory, or if immutability is needed, be explicit about why.

**Status**: 🔴 Not fixed - recommend addressing in future PR

### 5. Redundant Array Transformations
**Location**: `src/utils/leaderboard/filterAndSortPlayers.ts`, lines 65-67  
**Impact**: Low - Minor overhead  
**Issue**: Calls `.map(id => id.toString())` three separate times to convert IDs to strings:

```typescript
const friendIdsSet = new Set(friendIds.map(id => id.toString()));
const selectedFriendIdsSet = new Set(selectedFriendIds.map(id => id.toString()));
const groupMemberIdsSet = new Set(selectedGroupMemberIds.map(id => id.toString()));
```

**Recommendation**: Transform once and reuse if the same IDs are used multiple times.

**Status**: 🔴 Not fixed - recommend addressing in future PR

## Summary

**Total issues identified**: 5
- High priority: 1
- Medium priority: 1
- Low priority: 3

**Fixed in this PR**: Issue #1 - N+1 Query Pattern in useHomeData Hook

This PR focuses on fixing the highest-impact performance issue. The remaining issues are documented here for future optimization work.

## Performance Impact

The fix in this PR eliminates the N+1 query pattern in the home page data fetching:

**Before**: 17 sequential database queries (one per game)
**After**: 1 database query (fetch all user scores at once)

**Expected improvement**: 10-15x faster home page load time, reduced database load, better user experience.

## Testing Recommendations

After applying this fix:
1. Verify home page loads correctly
2. Confirm all user scores are displayed properly
3. Check that game-specific score displays still work
4. Monitor database query logs to confirm single query execution
5. Test with users who have many games vs few games

## Future Work

The remaining 4 issues should be addressed in separate PRs to keep changes focused and reviewable. Recommended order:
1. Issue #2 (Medium) - Consolidate duplicate service code
2. Issue #3 (Low) - Remove wasteful useEffect
3. Issue #4 (Low) - Optimize array operations
4. Issue #5 (Low) - Reduce redundant transformations
