import { describe, it, expect } from "vitest";
import {
  TRANSITIONS,
  getAllowedTransitions,
  canTransition,
  isPaused,
  isTerminal,
  isActive,
  STATUS_ORDER,
} from "./state-machine";
import { REQUEST_STATUSES } from "@/lib/constants";

describe("state-machine: TRANSITIONS integrity", () => {
  it("setiap transition merujuk ke status yang valid", () => {
    for (const t of TRANSITIONS) {
      expect(REQUEST_STATUSES).toContain(t.from);
      expect(REQUEST_STATUSES).toContain(t.to);
    }
  });

  it("setiap transition punya minimal 1 allowed role", () => {
    for (const t of TRANSITIONS) {
      expect(t.allowedRoles.length).toBeGreaterThan(0);
    }
  });

  it("tidak ada transition self-loop", () => {
    for (const t of TRANSITIONS) {
      expect(t.from).not.toBe(t.to);
    }
  });
});

describe("state-machine: getAllowedTransitions", () => {
  it("requestor bisa submit dari draft", () => {
    const next = getAllowedTransitions("draft", "requestor");
    expect(next.some((t) => t.to === "submitted")).toBe(true);
  });

  it("engineer tidak bisa approve request (bukan role)", () => {
    const next = getAllowedTransitions("pending_approval", "engineer");
    expect(next.length).toBe(0);
  });

  it("data_owner bisa approve request pending_approval", () => {
    const next = getAllowedTransitions("pending_approval", "data_owner");
    expect(next.some((t) => t.to === "assigned")).toBe(true);
  });

  it("reviewer bisa approve & deliver dari in_review", () => {
    const next = getAllowedTransitions("in_review", "reviewer");
    expect(next.some((t) => t.to === "pending_requestor_confirmation")).toBe(true);
  });

  it("reviewer bisa send back ke engineer dengan comment wajib", () => {
    const next = getAllowedTransitions("in_review", "reviewer");
    const sendBack = next.find((t) => t.to === "in_progress");
    expect(sendBack).toBeDefined();
    expect(sendBack?.requiresComment).toBe(true);
  });

  it("requestor bisa konfirmasi ke delivered", () => {
    const next = getAllowedTransitions("pending_requestor_confirmation", "requestor");
    expect(next.some((t) => t.to === "delivered")).toBe(true);
  });

  it("requestor bisa minta revision dengan comment wajib", () => {
    const next = getAllowedTransitions("pending_requestor_confirmation", "requestor");
    const reopen = next.find((t) => t.to === "reopened");
    expect(reopen?.requiresComment).toBe(true);
  });

  it("status terminal tidak punya outgoing transition", () => {
    expect(getAllowedTransitions("closed", "hcis_manager").length).toBe(0);
    expect(getAllowedTransitions("cancelled", "hcis_manager").length).toBe(0);
    expect(getAllowedTransitions("rejected", "hcis_manager").length).toBe(0);
  });
});

describe("state-machine: canTransition", () => {
  it("approve request flow valid", () => {
    expect(canTransition("pending_approval", "assigned", "data_owner")).toBe(true);
  });

  it("requestor tidak boleh assign engineer", () => {
    expect(canTransition("submitted", "assigned", "requestor")).toBe(false);
  });

  it("transition yang tidak ada di TRANSITIONS = false", () => {
    expect(canTransition("draft", "delivered", "hcis_manager")).toBe(false);
  });
});

describe("state-machine: isPaused / isTerminal / isActive", () => {
  it("isPaused untuk in_clarification, pending_requestor_confirmation, on_hold", () => {
    expect(isPaused("in_clarification")).toBe(true);
    expect(isPaused("pending_requestor_confirmation")).toBe(true);
    expect(isPaused("on_hold")).toBe(true);
    expect(isPaused("in_progress")).toBe(false);
  });

  it("isTerminal untuk closed, cancelled, rejected", () => {
    expect(isTerminal("closed")).toBe(true);
    expect(isTerminal("cancelled")).toBe(true);
    expect(isTerminal("rejected")).toBe(true);
    expect(isTerminal("in_progress")).toBe(false);
    expect(isTerminal("draft")).toBe(false);
  });

  it("isActive: tidak terminal dan tidak draft", () => {
    expect(isActive("in_progress")).toBe(true);
    expect(isActive("submitted")).toBe(true);
    expect(isActive("closed")).toBe(false);
    expect(isActive("draft")).toBe(false);
  });
});

describe("state-machine: STATUS_ORDER", () => {
  it("draft selalu pertama", () => {
    expect(STATUS_ORDER[0]).toBe("draft");
  });

  it("closed selalu terakhir", () => {
    expect(STATUS_ORDER[STATUS_ORDER.length - 1]).toBe("closed");
  });

  it("urutan semua status normal lifecycle terdefinisi", () => {
    expect(STATUS_ORDER).toContain("submitted");
    expect(STATUS_ORDER).toContain("pending_approval");
    expect(STATUS_ORDER).toContain("assigned");
    expect(STATUS_ORDER).toContain("in_progress");
    expect(STATUS_ORDER).toContain("in_review");
    expect(STATUS_ORDER).toContain("delivered");
  });
});

describe("state-machine: end-to-end happy path", () => {
  it("requestor → submitted → pending_approval → assigned → in_progress → in_review → pending_requestor_confirmation → delivered → closed", () => {
    expect(canTransition("draft", "submitted", "requestor")).toBe(true);
    expect(canTransition("submitted", "pending_approval", "hcis_manager")).toBe(true);
    expect(canTransition("pending_approval", "assigned", "data_owner")).toBe(true);
    expect(canTransition("assigned", "in_progress", "engineer")).toBe(true);
    expect(canTransition("in_progress", "in_review", "engineer")).toBe(true);
    expect(canTransition("in_review", "pending_requestor_confirmation", "reviewer")).toBe(true);
    expect(canTransition("pending_requestor_confirmation", "delivered", "requestor")).toBe(true);
    expect(canTransition("delivered", "closed", "requestor")).toBe(true);
  });
});
