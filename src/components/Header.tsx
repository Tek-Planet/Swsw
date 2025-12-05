
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons';

export const TopNavBar: React.FC = () => (
    <View>
      
    </View>
  );
  
export const Header: React.FC = () => (
    <View style={styles.header}>
      <Text style={styles.greeting}>It's time to dance, Anushka</Text>
      <View style={styles.headerActions}>
          <Text style={styles.partyGenie}>Party Genie</Text>
          <Icon name="help-circle-outline" size={24} color="#fff" />
      </View>
  
    </View>
  );

interface AppHeaderProps {
    title: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({title}) => (
    <View style={styles.appHeader}>
        <Text style={styles.appHeaderTitle}>{title}</Text>
    </View>
)

const styles = StyleSheet.create({
   
      header: {
        padding: 20,
        marginTop:10
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
        paddingVertical: 10,
        backgroundColor: '#1a1a1a',
        alignItems: 'center'
      },
      appHeaderTitle:{
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
      }
});
