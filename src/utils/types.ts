export interface Game {
  id: string;
  name: string;
  description: string;
  image: string;
  color: string;
}

export interface Score {
  id: string;
  playerId: string;
  gameId: string;
  value: number;
  createdAt: string;
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  connectionId?: string; // Add this new field to facilitate removal of friends
}

export interface Connection {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
}
