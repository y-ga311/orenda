import { HomeScreen } from "@/components/HomeScreen";
import { TeacherQuestTransitionProvider } from "@/components/TeacherQuestBattleTransition";

export default function Page() {
  return (
    <TeacherQuestTransitionProvider>
      <HomeScreen />
    </TeacherQuestTransitionProvider>
  );
}
