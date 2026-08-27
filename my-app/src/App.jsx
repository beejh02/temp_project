import { BrowserRouter, Route, Routes } from "react-router-dom";

import MissionDemoProvider from "./components/MissionDemoProvider";
import UserLayout from "./components/UserLayout";
import UserMapPage from "./pages/UserMapPage";
import AdminMapPage from "./pages/AdminMapPage";
import MissionChallengesPage from "./pages/MissionChallengesPage";
import MissionDetailPage from "./pages/MissionDetailPage";
import MissionGuidePage from "./pages/MissionGuidePage";
import MissionRankingsPage from "./pages/MissionRankingsPage";
import MissionsPage from "./pages/MissionsPage";
import SectionPlaceholderPage from "./pages/SectionPlaceholderPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 사용자 화면 */}
        <Route
          element={(
            <MissionDemoProvider>
              <UserLayout />
            </MissionDemoProvider>
          )}
        >
          <Route path="/" element={<UserMapPage />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/missions/guide" element={<MissionGuidePage />} />
          <Route
            path="/missions/challenges"
            element={<MissionChallengesPage />}
          />
          <Route
            path="/missions/rankings"
            element={<MissionRankingsPage />}
          />
          <Route path="/missions/:missionId" element={<MissionDetailPage />} />
          <Route
            path="/mypage"
            element={(
              <SectionPlaceholderPage
                eyebrow="준비 중"
                title="마이페이지"
                description="내 포인트와 활동 기록을 확인하는 공간입니다."
              />
            )}
          />
        </Route>

        {/* 관리자 화면 */}
        <Route path="/admin" element={<AdminMapPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
