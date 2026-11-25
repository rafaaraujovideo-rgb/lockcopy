import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn() }));
vi.mock("@/lib/api.functions", () => ({
  portalLoad: api.load,
  portalSave: api.save,
  portalNotes: async () => ({}),
  portalAttachWebp: vi.fn(), portalRegisterFile: vi.fn(), portalRemoveFile: vi.fn(),
  portalSendToAgency: vi.fn(), portalSetNote: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: object) => ({
    options, useParams: () => ({ token: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }),
  }),
}));

import { Route } from "@/routes/c/$token";

const payload = (status = "pending", text = "") => ({
  request: { title: "Website content", agency_name: "Test Studio", client_name: "Client", due_date: null },
  sections: [{ id: "page", title: "Homepage", fields: [{ id: "field", label: "Headline", field_type: "text" }] }],
  submissions: [{ field_id: "field", status, value_text: text, files: [] }],
});

afterEach(() => { cleanup(); vi.clearAllMocks(); });

function openPortal() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const Portal = Route.options.component;
  if (!Portal) throw new Error("Portal component is missing");
  render(<QueryClientProvider client={client}><Portal /></QueryClientProvider>);
  return client;
}

describe("Portal text autosave", () => {
  it("refreshes saved progress and enables sending without a page reload", async () => {
    api.load.mockResolvedValueOnce(payload()).mockResolvedValue(payload("submitted", "Ready to publish"));
    api.save.mockResolvedValue({ status: "submitted" });
    const client = openPortal();
    expect(await screen.findByText("0%" )).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send to agency" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Headline"), { target: { value: "Ready to publish" } });
    await screen.findByText("100%", {}, { timeout: 3000 });
    expect(api.save).toHaveBeenCalledWith({ data: {
      token: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", fieldId: "field", text: "Ready to publish",
    } });
    expect(screen.getByRole("button", { name: "Send to agency" })).toBeEnabled();
    expect(client.getQueryData(["portal", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"])).toEqual(payload("submitted", "Ready to publish"));
    client.clear();
  });

  it("does not advance progress when saving fails", async () => {
    api.load.mockResolvedValue(payload());
    api.save.mockRejectedValue(new Error("Unable to save"));
    const client = openPortal();
    fireEvent.change(await screen.findByLabelText("Headline"), { target: { value: "Unsaved text" } });
    await waitFor(() => expect(api.save).toHaveBeenCalled(), { timeout: 3000 });
    await screen.findByText("error saving");
    expect(api.load).toHaveBeenCalledTimes(1);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send to agency" })).toBeDisabled();
    client.clear();
  });
});