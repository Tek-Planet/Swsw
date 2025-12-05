import React from 'react';
import { View, FlatList } from 'react-native';
import ProfileMiniCard from './ProfileMiniCard';

interface RecommendationListProps {
  recommendations: {
    id: string;
    avatar: string;
    name: string;
    descriptor: string;
  }[];
}

const RecommendationList: React.FC<RecommendationListProps> = ({ recommendations }) => (
  <View>
    <FlatList
      data={recommendations}
      renderItem={({ item }) => <ProfileMiniCard user={item} />}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
    />
  </View>
);

export default RecommendationList;
