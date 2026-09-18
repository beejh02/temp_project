import { BrowserRouter, Route, Routes } from "react-router-dom";

import MissionDemoProvider from "./components/MissionDemoProvider";
import StartupProvider from "./components/StartupProvider";
import UserLayout from "./components/UserLayout";
import UserMapPage from "./pages/UserMapPage";
import AdminMapPage from "./pages/AdminMapPage";
import MissionChallengesPage from "./pages/MissionChallengesPage";
import MissionDetailPage from "./pages/MissionDetailPage";
import MissionGuidePage from "./pages/MissionGuidePage";
import MissionRankingsPage from "./pages/MissionRankingsPage";
import MissionsPage from "./pages/MissionsPage";
import MyPage from "./pages/MyPage";
import PointHistoryPage from "./pages/PointHistoryPage";
import PointExchangePage from "./pages/PointExchangePage";
import MyCouponsPage from "./pages/MyCouponsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 사용자 화면 */}
        <Route
          element={(
            <StartupProvider>
              <MissionDemoProvider>
                <UserLayout />
              </MissionDemoProvider>
            </StartupProvider>
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
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mypage/points" element={<PointHistoryPage />} />
          <Route path="/mypage/exchange" element={<PointExchangePage />} />
          <Route path="/mypage/coupons" element={<MyCouponsPage />} />
          <Route path="/mypage/coupons/:couponId" element={<MyCouponsPage />} />
        </Route>

        {/* 관리자 화면 */}
        <Route path="/admin" element={<AdminMapPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
