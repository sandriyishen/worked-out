import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WorkoutHistoryProvider } from '../src/state/WorkoutHistoryContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <WorkoutHistoryProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0D0D0F' },
            animation: 'fade',
          }}
        />
      </WorkoutHistoryProvider>
    </SafeAreaProvider>
  );
}
