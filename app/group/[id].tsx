import { SafeAreaView } from "react-native-safe-area-context";
import { GroupDetailScreen } from "@/ui/screens/GroupDetailScreen";

export default function GroupDetailRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <GroupDetailScreen />
    </SafeAreaView>
  );
}
