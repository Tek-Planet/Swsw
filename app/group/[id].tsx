import React from "react";
import { StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";

import GroupHeader from "@/components/GroupHeader";
import GroupEventPlanner from "@/components/GroupEventPlanner";
import GroupExpenses from "@/components/GroupExpenses";
import ActivityFeed from "@/components/ActivityFeed";
import PollWidget from "@/components/PollWidget";

const GroupDetailPage: React.FC = () => {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView style={styles.container}>
      <GroupHeader groupId={groupId} />
      <GroupEventPlanner groupId={groupId} />
      <PollWidget groupId={groupId} />
      <GroupExpenses groupId={groupId} />
      <ActivityFeed groupId={groupId} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
});

export default GroupDetailPage;
