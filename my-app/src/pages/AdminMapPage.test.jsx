import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AdminMapPage from "./AdminMapPage";

vi.mock("../components/NaverMap", () => ({
  default: () => <div data-testid="naver-map" />,
}));

describe("AdminMapPage", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 3,
          name: "대전중앙시장",
          boundary: {
            type: "Polygon",
            coordinates: [[
              [127.43, 36.32],
              [127.44, 36.32],
              [127.44, 36.33],
              [127.43, 36.32],
            ]],
          },
        },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("미션 Provider 없이 관리자 위치 기능을 렌더링한다", async () => {
    render(<AdminMapPage />);

    expect(screen.getByTestId("naver-map")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "내 위치" }))
      .toBeInTheDocument();
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
  });

  it("저장된 시장을 선택해 이름과 편집 정점을 불러온다", async () => {
    render(<AdminMapPage />);

    const selector = await screen.findByLabelText("관리할 시장");

    fireEvent.change(selector, { target: { value: "3" } });

    expect(screen.getByLabelText("시장 이름"))
      .toHaveValue("대전중앙시장");
    expect(screen.getByText("선택 시장 수정 · 정점 3개"))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "수정" }))
      .toBeEnabled();
    expect(screen.getByRole("button", { name: "삭제" }))
      .toBeEnabled();
  });

  it("대전중앙시장을 삭제한 후 목록과 편집 선택을 비운다", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    render(<AdminMapPage />);
    await screen.findByRole("option", { name: "대전중앙시장" });
    fireEvent.change(screen.getByLabelText("관리할 시장"), { target: { value: "3" } });
    globalThis.fetch.mockImplementation(async (url, options) => {
      if (url === "/api/markets/3" && options?.method === "DELETE") return { ok: true, status: 204 };
      return { ok: true, json: async () => [] };
    });
    fireEvent.click(screen.getByRole("button", { name: "삭제" }));
    expect(await screen.findByRole("status")).toHaveTextContent("대전중앙시장 삭제 완료");
    expect(screen.queryByRole("option", { name: "대전중앙시장" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("관리할 시장")).toHaveValue("");
    expect(screen.getByLabelText("시장 이름")).toHaveValue("");
    expect(screen.getByText("새 시장 등록 · 정점 0개")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "삭제" })).not.toBeInTheDocument();
  });
});
