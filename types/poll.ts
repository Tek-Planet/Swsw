export interface Poll {
  id: string;
  groupId: string;
  question: string;
  options: PollOption[];
  createdAt: any; // Firestore timestamp
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}
