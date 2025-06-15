import { http, HttpResponse } from 'msw';

// Mock data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
};

const mockProfile = {
  id: 'test-user-id',
  username: 'testuser',
  full_name: 'Test User',
  avatar_url: null,
  selected_games: ['wordle', 'connections'],
};

const mockScores = [
  {
    id: 'score-1',
    game_id: 'wordle',
    user_id: 'test-user-id',
    value: 3,
    date: '2024-01-01',
    notes: '',
    created_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 'score-2',
    game_id: 'connections',
    user_id: 'test-user-id',
    value: 4,
    date: '2024-01-01',
    notes: 'Good puzzle today',
    created_at: '2024-01-01T10:30:00Z',
  },
];

export const handlers = [
  // Auth endpoints
  http.post('*/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: mockUser,
    });
  }),

  http.get('*/auth/v1/user', () => {
    return HttpResponse.json(mockUser);
  }),

  // Profiles
  http.get('*/rest/v1/profiles', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');
    
    if (userId === 'eq.test-user-id') {
      return HttpResponse.json([mockProfile]);
    }
    
    return HttpResponse.json([]);
  }),

  http.post('*/rest/v1/profiles', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockProfile, ...body });
  }),

  http.patch('*/rest/v1/profiles', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockProfile, ...body });
  }),

  // Scores
  http.get('*/rest/v1/scores', ({ request }) => {
    const url = new URL(request.url);
    const gameId = url.searchParams.get('game_id');
    const userId = url.searchParams.get('user_id');
    
    let filteredScores = mockScores;
    
    if (gameId?.startsWith('eq.')) {
      const gameIdValue = gameId.replace('eq.', '');
      filteredScores = filteredScores.filter(score => score.game_id === gameIdValue);
    }
    
    if (userId?.startsWith('eq.')) {
      const userIdValue = userId.replace('eq.', '');
      filteredScores = filteredScores.filter(score => score.user_id === userIdValue);
    }
    
    return HttpResponse.json(filteredScores);
  }),

  http.post('*/rest/v1/scores', async ({ request }) => {
    const body = await request.json() as any;
    const newScore = {
      id: `score-${Date.now()}`,
      game_id: body.game_id,
      user_id: body.user_id,
      value: body.value,
      date: body.date,
      notes: body.notes || '',
      created_at: new Date().toISOString(),
    };
    
    return HttpResponse.json(newScore);
  }),

  // RPC calls
  http.post('*/rest/v1/rpc/update_game_stats', () => {
    return HttpResponse.json({ success: true });
  }),

  http.post('*/rest/v1/rpc/get_best_score', () => {
    return HttpResponse.json(3);
  }),

  // Connections
  http.get('*/rest/v1/connections', () => {
    return HttpResponse.json([]);
  }),

  // Friend groups
  http.get('*/rest/v1/friend_groups', () => {
    return HttpResponse.json([]);
  }),
];