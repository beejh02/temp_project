import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PolygonEditor from "./PolygonEditor";

const coordinates = [
  { lat: 36.32, lng: 127.43 },
  { lat: 36.32, lng: 127.44 },
  { lat: 36.33, lng: 127.44 },
];

function renderEditor(overrides = {}) {
  const props = {
    map: null,
    name: "대전중앙시장",
    coordinates,
    markets: [{ id: 3, name: "대전중앙시장" }],
    selectedMarketId: 3,
    loadError: "",
    onNameChange: vi.fn(),
    onChange: vi.fn(),
    onMarketSelect: vi.fn(),
    onSaved: vi.fn(),
    onDeleted: vi.fn(),
    ...overrides,
  };

  render(<PolygonEditor {...props} />);

  return props;
}

describe("PolygonEditor", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("선택한 시장의 이름과 Polygon을 PUT으로 수정한다", async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 3 }),
    });
    const props = renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "수정" }));

    await waitFor(() => expect(props.onSaved).toHaveBeenCalledWith(3));
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/markets/3",
      expect.objectContaining({
        method: "PUT",
        credentials: "include",
      }),
    );
    const request = JSON.parse(globalThis.fetch.mock.calls[0][1].body);

    expect(request.name).toBe("대전중앙시장");
    expect(request.boundary.coordinates[0]).toEqual([
      [127.43, 36.32],
      [127.44, 36.32],
      [127.44, 36.33],
      [127.43, 36.32],
    ]);
    expect(screen.getByRole("status"))
      .toHaveTextContent("대전중앙시장 수정 완료");
  });

  it("삭제 확인 후 선택한 시장을 DELETE로 삭제한다", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    globalThis.fetch.mockResolvedValue({ ok: true });
    const props = renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "삭제" }));

    await waitFor(() => expect(props.onDeleted).toHaveBeenCalledWith(3));
    expect(globalThis.confirm)
      .toHaveBeenCalledWith("대전중앙시장 시장을 삭제하시겠습니까?");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/markets/3",
      expect.objectContaining({
        method: "DELETE",
        credentials: "include",
      }),
    );
    expect(screen.getByRole("status"))
      .toHaveTextContent("대전중앙시장 삭제 완료");
  });
});
