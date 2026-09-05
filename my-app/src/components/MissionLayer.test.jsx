import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import MissionLayer from "./MissionLayer";
import { demoMission } from "../test/missionDemoFixture";

afterEach(() => { delete window.naver; });

it("미션 상태 갱신은 카드를 바꾸고 지도 이동은 대상 변경 때만 실행한다", () => {
  const overlayLayer = document.createElement("div");
  window.naver = { maps: {
    LatLng: class { constructor(lat, lng) { this.lat = lat; this.lng = lng; } },
    OverlayView: class {
      setMap(map) { if (map) this.onAdd(); else this.onRemove(); }
      getPanes() { return { overlayLayer }; }
    },
    Event: { addListener: vi.fn(), removeListener: vi.fn() },
  } };
  const map = { panTo: vi.fn(), getZoom: () => 18, setZoom: vi.fn() };
  const view = (missions, focusedMissionId = 27) => (
    <MemoryRouter>
      <MissionLayer map={map} missions={missions} focusedMissionId={focusedMissionId} />
    </MemoryRouter>
  );
  const { container, rerender } = render(view([demoMission]));
  container.appendChild(overlayLayer);
  expect(map.panTo).toHaveBeenCalledTimes(1);
  expect(screen.getByText("진행 가능")).toBeInTheDocument();

  const completed = { ...demoMission, status: "completed" };
  rerender(view([completed]));
  expect(screen.getByText("완료")).toBeInTheDocument();
  expect(map.panTo).toHaveBeenCalledTimes(1);

  const moved = { ...completed, target: { ...completed.target,
    location: { latitude: 36.328, longitude: 127.428 },
  } };
  rerender(view([moved]));
  expect(map.panTo).toHaveBeenCalledTimes(2);
  expect(map.panTo).toHaveBeenLastCalledWith({ lat: 36.328, lng: 127.428 });

  rerender(view([moved, { ...moved, id: 28 }], 28));
  expect(map.panTo).toHaveBeenCalledTimes(3);
});
