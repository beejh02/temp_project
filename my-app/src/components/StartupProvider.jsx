import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import StartupContext from "../contexts/startupContext";

function createStartupTasks(pathname) {
  const tasks = [{ id: "image", label: "시작 화면" }];

  if (pathname === "/") {
    tasks.push(
      { id: "map", label: "동네 지도" },
      { id: "markets", label: "전통시장" },
      { id: "stores", label: "주변 점포" },
    );
  }

  tasks.push({ id: "missions", label: "오늘의 미션" });

  return tasks.map((task) => ({ ...task, status: "pending" }));
}

function StartupProvider({ children }) {
  const { pathname } = useLocation();
  // Track only the entry route; later navigation and polling cannot restart it.
  const [tasks, setTasks] = useState(() => createStartupTasks(pathname));

  const reportTask = useCallback((id, status) => {
    if (status !== "ready" && status !== "error") {
      return;
    }

    setTasks((currentTasks) => {
      const task = currentTasks.find((item) => item.id === id);
      // The SDK can report an authentication failure after constructing a map.
      const isLateMapFailure = id === "map" && status === "error" && task?.status === "ready";

      if (!task || (task.status !== "pending" && !isLateMapFailure)) {
        return currentTasks;
      }

      return currentTasks.map((item) => (
        item.id === id ? { ...item, status } : item
      ));
    });
  }, []);

  const value = useMemo(() => ({ tasks, reportTask }), [tasks, reportTask]);

  return (
    <StartupContext.Provider value={value}>
      {children}
    </StartupContext.Provider>
  );
}

export default StartupProvider;
