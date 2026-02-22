import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileScreen } from '@/ui/screens/ProfileScreen';

export default function ProfileTabScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top']}>
      <ProfileScreen />
    </SafeAreaView>
  );
}
