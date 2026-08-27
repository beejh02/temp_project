import { useContext } from "react";

import MissionDemoContext from "../contexts/missionDemoContext";

function useMissionDemo() {
  const context = useContext(MissionDemoContext);

  if (!context) {
    throw new Error("useMissionDemo는 MissionDemoProvider 안에서 사용해야 합니다.");
  }

  return context;
}

export default useMissionDemo;
