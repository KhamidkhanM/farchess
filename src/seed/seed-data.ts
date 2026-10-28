// Sample data for development. `npm run seed` puts it in the database.

const rating = (kind: string, value: number, change = 0, count = 0) => ({
  kind,
  value,
  change,
  count,
});

// Simple players for the other side of the board
const player = (username: string, blitz: number) => ({
  username,
  city: 'Tashkent',
  gamesPlayed: 300,
  ratings: [
    rating('Bullet', blitz - 80),
    rating('Blitz', blitz),
    rating('Rapid', blitz + 60),
  ],
});

export const members = [
  {
    username: 'khamid',
    city: 'Tashkent',
    createdAt: new Date('2026-03-04T10:00:00Z'),
    gamesPlayed: 1462,
    favoriteOpenings: 'Italian with white, Caro-Kann with black',
    ratings: [
      rating('Bullet', 1488, -12, 214),
      rating('Blitz', 1612, 34, 1092),
      rating('Rapid', 1705, 8, 156),
      rating('Puzzles', 1840, 21, 2310),
    ],
    blitzHistory: [
      1480, 1492, 1475, 1510, 1534, 1521, 1549, 1566, 1590, 1640, 1578, 1612,
    ],
    coachTip: {
      title: 'Strong openings, leaky endgames.',
      text: 'In 7 of your 11 losses you were equal or better at move 30. Most slips came in king-and-pawn endings where your king stayed back too long.',
      action: 'Practice 10 endgames',
    },
  },
  player('opponent', 1638),
  player('player_one', 2214),
  player('player_two', 2190),
  player('player_three', 1876),
  player('player_four', 1902),
  player('player_five', 1640),
  player('player_six', 1655),
  player('player_seven', 2041),
  player('player_eight', 1998),
];

const line = (moves: string) => moves.split(' ');

const italian = line(
  'e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Bc5 O-O d6 c3 O-O Re1 a6 Bb3 Ba7 h3 h6',
);

// fen and lastMove are worked out from the moves by the seed script
export const liveGames = [
  {
    white: { username: 'khamid', rating: 1612, clock: 118 },
    black: { username: 'opponent', rating: 1638, clock: 161 },
    timeControl: '3+2',
    opening: 'Italian Game',
    moves: italian,
    evaluation: 0.6,
    watching: 14,
    chat: [
      { from: 'opponent', text: 'gl hf' },
      { from: 'khamid', text: 'you too!' },
    ],
  },
  {
    white: { username: 'player_one', rating: 2214, clock: 74 },
    black: { username: 'player_two', rating: 2190, clock: 92 },
    timeControl: '3+2',
    opening: 'Sicilian, Najdorf',
    moves: line(
      'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6 f3 Be7 Qd2 O-O O-O-O Nbd7 g4 b5 g5 Nh5',
    ),
    evaluation: 0.3,
    watching: 9,
  },
  {
    white: { username: 'player_three', rating: 1876, clock: 201 },
    black: { username: 'player_four', rating: 1902, clock: 188 },
    timeControl: '5+0',
    opening: 'Queen’s Gambit Declined',
    moves: line('d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6'),
    evaluation: 0.2,
    watching: 6,
  },
  {
    white: { username: 'player_five', rating: 1640, clock: 312 },
    black: { username: 'player_six', rating: 1655, clock: 290 },
    timeControl: '10+0',
    opening: 'Caro-Kann, Advance',
    moves: line('e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 Be3 Nd7 O-O Ne7 c3 Nc6'),
    evaluation: 0.1,
    watching: 4,
  },
  {
    white: { username: 'player_seven', rating: 2041, clock: 11 },
    black: { username: 'player_eight', rating: 1998, clock: 7 },
    timeControl: '1+0',
    opening: 'London System',
    moves: line('d4 d5 Bf4 Nf6 e3 c5 c3 Nc6 Nd2 e6 Ngf3 Bd6 Bg3 O-O Bd3 b6'),
    evaluation: -0.2,
    watching: 3,
  },
];

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

export const finishedGames = [
  {
    white: { username: 'khamid', rating: 1603, ratingChange: 9, clock: 41 },
    black: { username: 'player_one', rating: 1638, ratingChange: -9, clock: 0 },
    result: '1-0',
    timeControl: '3+2',
    opening: 'Italian Game',
    moves: line('e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 e5 d5 Bb5 Ne4'),
    createdAt: daysAgo(1),
  },
  {
    white: { username: 'player_two', rating: 1701, ratingChange: 6, clock: 52 },
    black: { username: 'khamid', rating: 1609, ratingChange: -6, clock: 0 },
    result: '1-0',
    timeControl: '3+2',
    opening: 'Caro-Kann, Advance',
    moves: line('e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 Nd7 O-O h6 Nbd2 Ne7'),
    createdAt: daysAgo(2),
  },
  {
    white: { username: 'khamid', rating: 1608, ratingChange: 1, clock: 64 },
    black: {
      username: 'player_three',
      rating: 1594,
      ratingChange: -1,
      clock: 70,
    },
    result: '1/2-1/2',
    timeControl: '5+0',
    opening: 'Queen’s Gambit Declined',
    moves: line('d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7'),
    createdAt: daysAgo(3),
  },
  {
    white: { username: 'khamid', rating: 1600, ratingChange: 8, clock: 33 },
    black: {
      username: 'player_four',
      rating: 1622,
      ratingChange: -8,
      clock: 0,
    },
    result: '1-0',
    timeControl: '3+2',
    opening: 'Italian Game',
    moves: line('e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Be7 O-O O-O Re1 d6 a4 Na5'),
    createdAt: daysAgo(4),
  },
  {
    white: {
      username: 'player_five',
      rating: 1580,
      ratingChange: -6,
      clock: 0,
    },
    black: { username: 'khamid', rating: 1594, ratingChange: 6, clock: 120 },
    result: '0-1',
    timeControl: '10+0',
    opening: 'Sicilian, Alapin',
    moves: line('e4 c5 c3 d5 exd5 Qxd5 d4 Nf6 Nf3 Bg4 Be2 e6'),
    createdAt: daysAgo(5),
  },
];

// Next Saturday at 18:00 in Tashkent (13:00 UTC), so the event is always upcoming
const nextSaturday = () => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + ((6 - date.getUTCDay() + 7) % 7 || 7));
  date.setUTCHours(13, 0, 0, 0);
  return date;
};

// A few days from now at a Tashkent hour (Tashkent is UTC+5)
const inDays = (days: number, tashkentHour: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(tashkentHour - 5, 0, 0, 0);
  return date;
};

export const tournaments = [
  {
    name: 'farchess Weekend Arena',
    startsAt: nextSaturday(),
    timeControl: '3+2',
    rounds: 7,
    format: 'Swiss',
    joined: 64,
    capacity: 128,
  },
  {
    name: 'Evening Bullet Blitz',
    startsAt: inDays(1, 20),
    timeControl: '1+0',
    rounds: 9,
    format: 'Arena',
    joined: 37,
    capacity: 100,
  },
  {
    name: 'Tashkent Rapid Open',
    startsAt: inDays(3, 15),
    timeControl: '15+10',
    rounds: 5,
    format: 'Swiss',
    joined: 22,
    capacity: 32,
  },
  {
    name: 'Beginners Cup (under 1600)',
    startsAt: inDays(4, 18),
    timeControl: '10+0',
    rounds: 5,
    format: 'Swiss',
    joined: 15,
    capacity: 16,
  },
  {
    name: 'Sunday Classical',
    startsAt: inDays(9, 11),
    timeControl: '30+0',
    rounds: 4,
    format: 'Swiss',
    joined: 8,
    capacity: 24,
  },
];
