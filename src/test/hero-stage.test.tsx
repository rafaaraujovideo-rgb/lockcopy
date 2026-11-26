import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HeroStage } from "@/components/hero-stage";

afterEach(cleanup);

describe("Hero demo product rules", () => {
  it("caps the business website headline at 90 characters, including pasted text", () => {
    render(<HeroStage />);
    const headline = screen.getByLabelText("Hero headline");
    fireEvent.change(headline, { target: { value: "a".repeat(110) } });
    expect(headline).toHaveValue("a".repeat(90));
  });

  it("locks approved answers and preserves the value across both views until unlocked", () => {
    render(<HeroStage />);
    fireEvent.change(screen.getByLabelText("Hero headline"), { target: { value: "Fresh bread every morning" } });
    fireEvent.click(screen.getByRole("button", { name: "2 · Your studio approves" }));
    const row = screen.getByText("Fresh bread every morning").closest(".demo-review-row");
    if (!row) throw new Error("Missing headline review row");
    fireEvent.click(within(row as HTMLElement).getByRole("button", { name: "Approve" }));
    fireEvent.click(screen.getByRole("button", { name: "1 · Your client fills it in" }));
    expect(screen.getByLabelText("Hero headline")).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Hero headline"), { target: { value: "Changed" } });
    expect(screen.getByLabelText("Hero headline")).toHaveValue("Fresh bread every morning");
    fireEvent.click(screen.getByRole("button", { name: "2 · Your studio approves" }));
    fireEvent.click(screen.getByRole("button", { name: "Unlock Hero headline" }));
    fireEvent.click(screen.getByRole("button", { name: "1 · Your client fills it in" }));
    expect(screen.getByLabelText("Hero headline")).toBeEnabled();
  });
});