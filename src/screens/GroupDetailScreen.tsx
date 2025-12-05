
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';

import GroupHeader from '../components/GroupHeader';
import GroupEventPlanner from '../components/GroupEventPlanner';
import GroupExpenses from '../components/GroupExpenses';
import ActivityFeed from '../components/ActivityFeed';

type GroupDetailPageProps = {
    route: RouteProp<RootStackParamList, 'GroupDetail'>;
  };
  
const GroupDetailPage: React.FC<GroupDetailPageProps> = ({ route }) => {
    const { groupId } = route.params;
    
    return (
        <ScrollView style={styles.container}>
          <GroupHeader groupId={groupId} />
          <GroupEventPlanner groupId={groupId} />
          <GroupExpenses groupId={groupId} />
          <ActivityFeed groupId={groupId} />
        </ScrollView>
      );
    };
    
const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
      },
});
      
export default GroupDetailPage;
