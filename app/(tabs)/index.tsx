import { SafeAreaView } from 'react-native-safe-area-context';
import { GroupFeedScreen } from '@/ui/screens/GroupFeedScreen';

export default function FeedScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top']}>
      <GroupFeedScreen />
    </SafeAreaView>
  );
}
