import { useState } from "react";

import NaverMap from "../components/NaverMap";
import MapSearch from "../components/MapSearch";

import "../App.css";

function AdminMapPage() {
  const [map, setMap] = useState(null);

  return (
    <div className="app">
      <NaverMap onMapReady={setMap} />

      <MapSearch map={map} />

      {/* PolygonEditor는 나중에 추가 */}
    </div>
  );
}

export default AdminMapPage;