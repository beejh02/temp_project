import { BrowserRouter, Route, Routes } from "react-router-dom";

import UserLayout from "./components/UserLayout";
import UserMapPage from "./pages/UserMapPage";
import AdminMapPage from "./pages/AdminMapPage";
import SectionPlaceholderPage from "./pages/SectionPlaceholderPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 사용자 화면 */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<UserMapPage />} />
          <Route
            path="/missions"
            element={(
              <SectionPlaceholderPage
                eyebrow="다음 개발 단계"
                title="미션"
                description="오늘의 미션과 도전 기록이 이 화면에 들어올 예정입니다."
              />
            )}
          />
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
