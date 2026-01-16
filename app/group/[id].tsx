
import React from "react";
import { StyleSheet, ScrollView, View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

import GroupHeader from "@/components/GroupHeader";
import GroupEventPlanner from "@/components/GroupEventPlanner";
import GroupExpenses from "@/components/GroupExpenses";
import PollWidget from "@/components/PollWidget";
import { AppHeader } from "@/components/Header";

const GroupDetailPage: React.FC = () => {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();

  // Type check to ensure groupId is a valid string
  if (typeof groupId !== 'string') {
    return (
      <View style={styles.container}>
        <AppHeader title="Error" />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Group not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Group" />
      <ScrollView>
        <GroupHeader groupId={groupId} />
        <GroupEventPlanner groupId={groupId} />
        <PollWidget groupId={groupId} />
        <GroupExpenses groupId={groupId} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "white",
    fontSize: 18,
  },
});

export default GroupDetailPage;
