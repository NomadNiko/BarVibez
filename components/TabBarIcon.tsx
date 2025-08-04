import FontAwesome from '@expo/vector-icons/FontAwesome';
// Removed @roninoss/icons import - using only FontAwesome now
import { StyleSheet } from 'react-native';

export const TabBarIcon = (props: {
  name: React.ComponentProps<typeof FontAwesome>['name'] | string;
  color: string;
  useNative?: boolean;
  fallbackName?: React.ComponentProps<typeof FontAwesome>['name'];
}) => {
  // Always use FontAwesome now - removed native/SF Symbol support

  return (
    <FontAwesome
      size={28}
      style={styles.tabBarIcon}
      {...props}
      name={props.name as React.ComponentProps<typeof FontAwesome>['name']}
    />
  );
};

export const styles = StyleSheet.create({
  tabBarIcon: {
    marginBottom: -3,
  },
});
