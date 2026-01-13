import { listenToGroupPolls, voteOnPoll } from '@/lib/services/pollService';
import { Poll } from '@/types/poll';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

interface PollWidgetProps {
  groupId: string;
}

const PollWidget: React.FC<PollWidgetProps> = ({ groupId }) => {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Hardcoded for now, this should come from an auth hook
  const userId = 'test-user';

  useEffect(() => {
    const unsubscribe = listenToGroupPolls(groupId, (polls) => {
      if (polls.length > 0) {
        setPoll(polls[0]);
        // Set selected option if user has already voted
        polls[0].options.forEach(option => {
          if (option.voters.includes(userId)) {
            setSelectedOption(option.id);
          }
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const handleVote = async (optionId: string) => {
    if (poll) {
      await voteOnPoll(poll.id, optionId, userId);
    }
  };

  if (loading) {
    return <ActivityIndicator />;
  }

  if (!poll) {
    return null; // Or some placeholder
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{poll.question}</Text>
      {poll.options.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.option,
            selectedOption === option.id && styles.selectedOption,
          ]}
          onPress={() => handleVote(option.id)}
        >
          <Text style={styles.optionText}>{option.text}</Text>
          <Text style={styles.voteCount}>{option.votes}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  option: {
    backgroundColor: '#3a3a3a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#6c63ff',
  },
  optionText: {
    color: 'white',
    fontSize: 16,
  },
  voteCount: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PollWidget;
