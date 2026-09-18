import { fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import StartupProvider from "./StartupProvider";
import useStartup from "../hooks/useStartup";

function StartupProbe() {
  const startup = useStartup();

  if (!startup) {
    return <span>추적 없음</span>;
  }

  return (
    <>
      <output data-testid="tasks">{JSON.stringify(startup.tasks)}</output>
      <button onClick={() => startup.reportTask("missions", "ready")}>완료</button>
      <button onClick={() => startup.reportTask("missions", "error")}>실패</button>
      <button onClick={() => startup.reportTask("missions", "pending")}>갱신</button>
      <Link to="/">지도로 이동</Link>
    </>
  );
}

const readTasks = () => JSON.parse(screen.getByTestId("tasks").textContent);

describe("StartupProvider", () => {
  it("지도 첫 진입에서 실제 준비 작업 다섯 가지를 기다린다", () => {
    render(<MemoryRouter><StartupProvider><StartupProbe /></StartupProvider></MemoryRouter>);

    expect(readTasks().map(({ id, status }) => [id, status])).toEqual([
      ["image", "pending"],
      ["map", "pending"],
      ["markets", "pending"],
      ["stores", "pending"],
      ["missions", "pending"],
    ]);
  });

  it("미션 직접 진입은 미표시 지도를 기다리지 않으며 이후 이동으로 다시 시작하지 않는다", () => {
    render(
      <MemoryRouter initialEntries={["/missions"]}>
        <StartupProvider><StartupProbe /></StartupProvider>
      </MemoryRouter>,
    );

    expect(readTasks().map(({ id }) => id)).toEqual(["image", "missions"]);
    fireEvent.click(screen.getByRole("button", { name: "완료" }));
    fireEvent.click(screen.getByRole("link", { name: "지도로 이동" }));
    expect(readTasks().map(({ id, status }) => [id, status])).toEqual([
      ["image", "pending"],
      ["missions", "ready"],
    ]);
  });

  it.each(["완료", "실패"])("첫 %s 결과를 보존해 재조회가 진행률을 되돌리지 않는다", (firstResult) => {
    render(<MemoryRouter><StartupProvider><StartupProbe /></StartupProvider></MemoryRouter>);

    fireEvent.click(screen.getByRole("button", { name: firstResult }));
    fireEvent.click(screen.getByRole("button", { name: "갱신" }));
    fireEvent.click(screen.getByRole("button", { name: firstResult === "완료" ? "실패" : "완료" }));

    expect(readTasks().find(({ id }) => id === "missions").status)
      .toBe(firstResult === "완료" ? "ready" : "error");
  });

  it("관리자 및 단독 컴포넌트는 추적기 없이도 사용할 수 있다", () => {
    render(<StartupProbe />);
    expect(screen.getByText("추적 없음")).toBeInTheDocument();
  });
});
