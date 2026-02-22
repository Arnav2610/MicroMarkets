import { SafeAreaView } from 'react-native-safe-area-context';
import { MarketDetailScreen } from '@/ui/screens/MarketDetailScreen';

export default function MarketDetailRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top']}>
      <MarketDetailScreen />
    </SafeAreaView>
  );
}
