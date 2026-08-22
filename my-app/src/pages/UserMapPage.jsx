import { useState } from "react";

import NaverMap from "../components/NaverMap";
import MapSearch from "../components/MapSearch";

import "../App.css";

function UserMapPage() {
  const [map, setMap] = useState(null);

  return (
    <div className="app">
      <NaverMap onMapReady={setMap} />

      <MapSearch map={map} />
    </div>
  );
}

export default UserMapPage;