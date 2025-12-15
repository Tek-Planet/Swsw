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
    thumbnail: 'https://plus.unsplash.com/premium_photo-1686054306703-fe68a1b0a7aa?q=80&w=1026&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    attendees: 25,
    chats: 5,
    photos: [
        { id: 'p1', url: 'https://plus.unsplash.com/premium_photo-1686054306703-fe68a1b0a7aa?q=80&w=1026&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
        { id: 'p2', url: 'https://plus.unsplash.com/premium_photo-1686054306703-fe68a1b0a7aa?q=80&w=1026&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
        { id: 'p3', url: 'https://plus.unsplash.com/premium_photo-1686054306703-fe68a1b0a7aa?q=80&w=1026&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
        { id: 'p4', url: 'https://plus.unsplash.com/premium_photo-1686054306703-fe68a1b0a7aa?q=80&w=1026&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
        { id: 'p5', url: 'https://plus.unsplash.com/premium_photo-1686054306703-fe68a1b0a7aa?q=80&w=1026&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
      ],
  },
  {
    id: '3',
    title: 'Warehouse Rave',
    thumbnail: 'https://images.unsplash.com/photo-1761839257046-84e95464cc52?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    attendees: 150,
    chats: 11,
    photos: [
        { id: 'p1', url: 'https://images.unsplash.com/photo-1761839257046-84e95464cc52?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
        { id: 'p2', url: 'https://images.unsplash.com/photo-1761839257046-84e95464cc52?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
        { id: 'p3', url: 'https://images.unsplash.com/photo-1761839257046-84e95464cc52?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
        { id: 'p4', url: 'https://images.unsplash.com/photo-1761839257046-84e95464cc52?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
        { id: 'p5', url: 'https://images.unsplash.com/photo-1761839257046-84e95464cc52?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
      ],
  },
];
