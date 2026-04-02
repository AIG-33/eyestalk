import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="venue/[id]/index" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="venue/[id]/people" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="venue/[id]/chat" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="venue/[id]/activities" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="venue/[id]/poll/[activityId]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="venue/check-in" options={{ presentation: 'modal' }} />
      <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="tokens" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
