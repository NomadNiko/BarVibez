import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';

interface BackButtonProps {
  onPress?: () => void;
  className?: string;
}

export const BackButton = ({ onPress, className }: BackButtonProps) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className={cn('ios:active:opacity-70 flex-row items-center', className)}>
      <FontAwesome name="chevron-left" size={20} color="#0066CC" style={{ marginRight: 4 }} />
      <Text className="font-medium text-primary">Back</Text>
    </Pressable>
  );
};
