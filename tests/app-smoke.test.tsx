import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/app/App";

describe("App", () => {
  it("renders starter title", () => {
    render(<App />);
    expect(screen.getByText("災害資訊整理工作台")).toBeInTheDocument();
  });

  it("keeps the home page focused on phase 0 tabs", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: "原始資訊" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "整理工作台" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "通報" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "地點" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "志工任務" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "人員指派" }),
    ).not.toBeInTheDocument();
  });

  it("shows review states in the phase 0 workbench", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(
      screen.getByText(
        "第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("待人工確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText("未查核").length).toBeGreaterThan(0);
  });

  it("uses distinct status classes for review and unverified records", () => {
    render(<App />);

    expect(screen.getAllByText("待人工確認")[0]).toHaveClass(
      "status-needs_review",
    );
    expect(screen.getAllByText("未查核")[0]).toHaveClass("status-unverified");
  });

  it("has draft CRUD features for Phase 0 editing", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    // Should have demo drafts pre-loaded
    expect(
      screen.getByRole("button", { name: /編輯草稿/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("示範草稿")).toBeInTheDocument();
  });

  it("marks an edited demo draft as a student draft", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));
    fireEvent.click(screen.getByRole("button", { name: "編輯草稿" }));
    fireEvent.click(screen.getByRole("button", { name: "儲存草稿" }));

    expect(screen.getByText("學員建立的草稿")).toBeInTheDocument();
    expect(
      screen.getByText(
        "能分辨示範草稿與學員建立的草稿（示範 5 個，學員 1 個）",
      ),
    ).toBeInTheDocument();
  });

  it("updates the Phase 0 checklist when drafts change", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(
      screen.getByText("已建立 6 個可編輯草稿（需 6 個）"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "至少標示 3 個「為什麼不能直接變成任務」（已完成 3 個）",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "刪除草稿" }));

    expect(
      screen.getByText("已建立 5 個可編輯草稿（需 6 個）"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "至少標示 3 個「為什麼不能直接變成任務」（已完成 2 個）",
      ),
    ).toBeInTheDocument();
  });
});
