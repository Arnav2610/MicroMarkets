import { SafeAreaView } from "react-native-safe-area-context";
import { GroupsScreen } from "@/ui/screens/GroupsScreen";

export default function GroupsTabScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <GroupsScreen />
    </SafeAreaView>
  );
}
