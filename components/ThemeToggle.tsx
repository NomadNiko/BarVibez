import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, View } from 'react-native';
import Animated, { LayoutAnimationConfig, ZoomInRotate } from 'react-native-reanimated';

import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { COLORS } from '~/theme/colors';

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  return (
    <LayoutAnimationConfig skipEntering>
      <Animated.View
        className="items-center justify-center"
        key={`toggle-${colorScheme}`}
        entering={ZoomInRotate}>
        <Pressable onPress={toggleColorScheme} className="opacity-80">
          {colorScheme === 'dark'
            ? ({ pressed }) => (
                <View className={cn('px-0.5', pressed && 'opacity-50')}>
                  <FontAwesome name="moon-o" color={COLORS.white} size={24} />
                </View>
              )
            : ({ pressed }) => (
                <View className={cn('px-0.5', pressed && 'opacity-50')}>
                  <FontAwesome name="sun-o" color={COLORS.black} size={24} />
                </View>
              )}
        </Pressable>
      </Animated.View>
    </LayoutAnimationConfig>
  );
}
