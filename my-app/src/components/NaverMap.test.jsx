import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const naverMapsMock = vi.hoisted(() => ({
  getNaverMapStyleId: vi.fn(() => ""),
  loadNaverMaps: vi.fn(),
  subscribeNaverMapsFailure: vi.fn(() => vi.fn()),
}));

vi.mock("../lib/naverMaps", () => naverMapsMock);

import NaverMap from "./NaverMap";

describe("NaverMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    naverMapsMock.subscribeNaverMapsFailure.mockReturnValue(vi.fn());
  });

  it("지도 서버 연결 실패 시 화면을 유지하고 재시도를 제공한다", async () => {
    naverMapsMock.loadNaverMaps
      .mockRejectedValueOnce(new Error("네이버 지도 서버 연결 실패"))
      .mockReturnValueOnce(new Promise(() => {}));

    render(<NaverMap onMapReady={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "지도를 불러오지 못했습니다.",
    );

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    await waitFor(() => {
      expect(naverMapsMock.loadNaverMaps).toHaveBeenLastCalledWith({
        forceReload: true,
      });
    });
  });
});
