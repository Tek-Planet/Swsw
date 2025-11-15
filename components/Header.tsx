
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export const TopNavBar = () => (
    <View style={styles.topNavBar}>
      <Text style={styles.time}>2:57</Text>
      <View style={styles.topNavIcons}>
        <Icon name="cellular" size={20} color="#fff" style={styles.navIcon} />
        <Icon name="wifi" size={20} color="#fff" style={styles.navIcon} />
        <Icon name="battery-full" size={20} color="#fff" style={styles.navIcon} />
      </View>
    </View>
  );
  
export const Header = () => (
    <View style={styles.header}>
      <Text style={styles.greeting}>It's time to dance, Anushka</Text>
      <View style={styles.headerActions}>
          <Text style={styles.partyGenie}>Party Genie</Text>
          <Icon name="help-circle-outline" size={24} color="#fff" />
      </View>
  
    </View>
  );

export const AppHeader = ({title}) => (
    <View style={styles.appHeader}>
        <Text style={styles.appHeaderTitle}>{title}</Text>
    </View>
)

const styles = StyleSheet.create({
    topNavBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
      },
      time: {
        color: '#fff',
        fontSize: 16,
      },
      topNavIcons: {
        flexDirection: 'row',
      },
      navIcon: {
        marginLeft: 15,
      },
      header: {
        padding: 20,
      },
      greeting: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
      },
      headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
      },
      partyGenie: {
        color: '#fff',
        marginRight: 10,
        fontSize:16
      },
      appHeader: {
        padding: 20,
        backgroundColor: '#1a1a1a',
        alignItems: 'center'
      },
      appHeaderTitle:{
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
      }
});
