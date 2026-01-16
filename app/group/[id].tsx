
import React from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import GroupHeader from "@/components/GroupHeader";
import GroupEventPlanner from "@/components/GroupEventPlanner";
import GroupExpenses from "@/components/GroupExpenses";
import ActivityFeed from "@/components/ActivityFeed";
import PollWidget from "@/components/PollWidget";
import { AppHeader } from "@/components/Header";

const GroupDetailPage: React.FC = () => {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <AppHeader title="Group" />
      <ScrollView>
        <GroupHeader groupId={groupId} />
        <GroupEventPlanner groupId={groupId} />
        <PollWidget groupId={groupId} />
        <GroupExpenses groupId={groupId} />
        <ActivityFeed groupId={groupId} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
});

export default GroupDetailPage;
