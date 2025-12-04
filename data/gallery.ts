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
    thumbnail: 'https://picsum.photos/200',
    attendees: 12,
    chats: 3,
    photos: [
      { id: 'p1', url: 'https://picsum.photos/200' },
      { id: 'p2', url: 'https://picsum.photos/200' },
      { id: 'p3', url: 'https://picsum.photos/200' },
      { id: 'p4', url: 'https://picsum.photos/200' },
      { id: 'p5', url: 'https://picsum.photos/200' },
    ],
  },
  {
    id: '2',
    title: 'Rooftop Sunset Drinks',
    thumbnail: 'https://images.unsplash.com/photo-1597159282583-034a3e9d0c64?w=200&h=200&fit=crop',
    attendees: 25,
    chats: 5,
    photos: [
        { id: 'p1', url: 'https://images.unsplash.com/photo-1597159282583-034a3e9d0c64?w=200&h=200&fit=crop' },
        { id: 'p2', url: 'https://images.unsplash.com/photo-1597159282583-034a3e9d0c64?w=200&h=200&fit=crop' },
        { id: 'p3', url: 'https://images.unsplash.com/photo-1597159282583-034a3e9d0c64?w=200&h=200&fit=crop' },
        { id: 'p4', url: 'https://images.unsplash.com/photo-1597159282583-034a3e9d0c64?w=200&h=200&fit=crop' },
        { id: 'p5', url: 'https://images.unsplash.com/photo-1597159282583-034a3e9d0c64?w=200&h=200&fit=crop' },
      ],
  },
  {
    id: '3',
    title: 'Warehouse Rave',
    thumbnail: 'https://picsum.photos/200',
    attendees: 150,
    chats: 11,
    photos: [
        { id: 'p1', url: 'https://picsum.photos/200' },
        { id: 'p2', url: 'https://picsum.photos/200' },
        { id: 'p3', url: 'https://picsum.photos/200' },
        { id: 'p4', url: 'https://picsum.photos/200' },
        { id: 'p5', url: 'https://picsum.photos/200' },
      ],
  },
];
