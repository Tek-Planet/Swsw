export interface Photo {
  id: string;
  url: string;
}

export interface Album {
  id: string;
  title: string;
  thumbnail: string;
  photos: Photo[];
  attendees: number;
  chats: number;
}

export const albums: Album[] = [
  {
    id: '1',
    title: 'Poker Party & Tournament',
    thumbnail: 'https://i.imgur.com/rN2a25m.jpeg',
    attendees: 12,
    chats: 3,
    photos: [
      { id: 'p1', url: 'https://i.imgur.com/rN2a25m.jpeg' },
      { id: 'p2', url: 'https://i.imgur.com/n4a2nLg.jpeg' },
      { id: 'p3', url: 'https://i.imgur.com/4cO2d2X.jpeg' },
      { id: 'p4', url: 'https://i.imgur.com/Kure61l.jpeg' },
      { id: 'p5', url: 'https://i.imgur.com/s2j9p6j.jpeg' },
    ],
  },
  {
    id: '2',
    title: 'Rooftop Sunset Drinks',
    thumbnail: 'https://i.imgur.com/n4a2nLg.jpeg',
    attendees: 25,
    chats: 5,
    photos: [
        { id: 'p1', url: 'https://i.imgur.com/n4a2nLg.jpeg' },
        { id: 'p2', url: 'https://i.imgur.com/s2j9p6j.jpeg' },
        { id: 'p3', url: 'https://i.imgur.com/4cO2d2X.jpeg' },
        { id: 'p4', url: 'https://i.imgur.com/Kure61l.jpeg' },
        { id: 'p5', url: 'https://i.imgur.com/rN2a25m.jpeg' },
      ],
  },
  {
    id: '3',
    title: 'Warehouse Rave',
    thumbnail: 'https://i.imgur.com/4cO2d2X.jpeg',
    attendees: 150,
    chats: 11,
    photos: [
        { id: 'p1', url: 'https://i.imgur.com/4cO2d2X.jpeg' },
        { id: 'p2', url: 'https://i.imgur.com/Kure61l.jpeg' },
        { id: 'p3', url: 'https://i.imgur.com/s2j9p6j.jpeg' },
        { id: 'p4', url: 'https://i.imgur.com/rN2a25m.jpeg' },
        { id: 'p5', url: 'https://i.imgur.com/n4a2nLg.jpeg' },
      ],
  },
];
