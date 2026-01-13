import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { Poll, PollOption } from '@/types/poll';

export const listenToGroupPolls = (
  groupId: string,
  callback: (polls: Poll[]) => void
) => {
  const pollsCollection = collection(db, 'polls');
  const q = query(pollsCollection, where('groupId', '==', groupId));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const polls = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Poll[];
    callback(polls);
  });

  return unsubscribe;
};

export const voteOnPoll = async (pollId: string, optionId: string, userId: string) => {
  const pollRef = doc(db, 'polls', pollId);

  await runTransaction(db, async (transaction) => {
    const pollDoc = await transaction.get(pollRef);
    if (!pollDoc.exists()) {
      throw new Error('Poll does not exist!');
    }

    const poll = pollDoc.data() as Poll;
    const newOptions = poll.options.map((option) => {
      if (option.id === optionId) {
        if (option.voters.includes(userId)) {
          // User has already voted for this option, so we remove the vote
          return {
            ...option,
            votes: option.votes - 1,
            voters: option.voters.filter((voter) => voter !== userId),
          };
        } else {
          // User has not voted for this option, so we add the vote
          return {
            ...option,
            votes: option.votes + 1,
            voters: [...option.voters, userId],
          };
        }
      } else {
        // If the user has voted for another option, we remove that vote
        if (option.voters.includes(userId)) {
          return {
            ...option,
            votes: option.votes - 1,
            voters: option.voters.filter((voter) => voter !== userId),
          };
        }
      }
      return option;
    });

    transaction.update(pollRef, { options: newOptions });
  });
};
