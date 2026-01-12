import { useAuth } from '@/lib/context/AuthContext';
import { listenToUserProfile } from '@/lib/firebase/userProfileService';
import { UserProfile } from '@/types';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

export const TopNavBar: React.FC = () => (
    <View>
      
    </View>
  );
  
export const Header: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      const unsubscribe = listenToUserProfile(user.uid, (profile) => {
        setUserProfile(profile);
      });
      return () => unsubscribe();
    }
  }, [user]);

  return (
    <View style={styles.header}>
      <Text style={styles.greeting}>
        {userProfile ? `It's time to have fun, ${userProfile.displayName}` : 'Loading...'}
      </Text>
      {/* <View style={styles.headerActions}>
          <Text style={styles.partyGenie}>Party Genie</Text>
          <Icon name="help-circle-outline" size={24} color="#fff" />
      </View>
   */}
    </View>
  );
};

interface AppHeaderProps {
    title: string;
    rightChild?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({title, rightChild}) => (
    <View style={styles.appHeader}>
        <View style={styles.leftContainer} />
        <Text style={styles.appHeaderTitle}>{title}</Text>
        <View style={styles.rightContainer}>
            {rightChild}
        </View>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#1a1a1a',
      },
      appHeaderTitle:{
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
      },
      leftContainer: {
          flex: 1,
      },
      rightContainer: {
          flex: 1,
          alignItems: 'flex-end',
      }
});
