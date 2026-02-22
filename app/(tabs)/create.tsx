import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { CreateMarketScreen } from '@/ui/screens/CreateMarketScreen';

export default function CreateScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CreateMarketScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});
