import { BrowserRouter, Routes, Route } from "react-router-dom";

import UserMapPage from "./pages/UserMapPage";
import AdminMapPage from "./pages/AdminMapPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 사용자 화면 */}
        <Route path="/" element={<UserMapPage />} />

        {/* 관리자 화면 */}
        <Route path="/admin" element={<AdminMapPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
