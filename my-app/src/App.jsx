import { BrowserRouter, Route, Routes } from "react-router-dom";

import UserLayout from "./components/UserLayout";
import UserMapPage from "./pages/UserMapPage";
import AdminMapPage from "./pages/AdminMapPage";
import MissionsPage from "./pages/MissionsPage";
import SectionPlaceholderPage from "./pages/SectionPlaceholderPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 사용자 화면 */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<UserMapPage />} />
          <Route path="/missions" element={<MissionsPage />} />
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
