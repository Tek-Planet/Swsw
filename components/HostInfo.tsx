
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons as Icon } from "@react-native-vector-icons/ionicons";

const HostInfo = ({ hostName, hostAvatar }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hosted by</Text>
      <View style={styles.hostContainer}>
        <Image source={{ uri: hostAvatar }} style={styles.avatar} />
        <Text style={styles.hostName}>{hostName}</Text>
        <TouchableOpacity>
          <Icon name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  title: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 10,
  },
  hostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  hostName: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
});

export default HostInfo;
