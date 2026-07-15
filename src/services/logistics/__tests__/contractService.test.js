import { describe, it, expect } from "vitest";
import { contractService } from "../contractService.js";

async function make(over = {}) {
  return contractService.create({
    title: "Paddy Supply", buyerName: "Buyer", farmerName: "FPO",
    commodity: "Paddy", quantityKg: 10000, pricePerKg: 25,
    qualityGrade: "A / FAQ", templateId: "spot", ...over,
  });
}

describe("contractService", () => {
  it("creates an offered contract with milestones and computed value", async () => {
    const c = await make();
    expect(c.status).toBe("offered");
    expect(c.value).toBe(10000 * 25);
    expect(c.milestones.length).toBeGreaterThan(0);
    expect(c.milestones.every((m) => !m.done)).toBe(true);
  });

  it("accepting moves it to active", async () => {
    const c = await make();
    const active = await contractService.accept(c.id);
    expect(active.status).toBe("active");
  });

  it("auto-completes when all milestones are done", async () => {
    const c = await make();
    await contractService.accept(c.id);
    let cur = await contractService.getById(c.id);
    for (let i = 0; i < cur.milestones.length; i++) {
      cur = await contractService.toggleMilestone(c.id, i);
    }
    expect(cur.status).toBe("completed");
    expect(contractService.progress(cur)).toBe(100);
  });

  it("records inspection outcome", async () => {
    const c = await make();
    const insp = await contractService.recordInspection(c.id, "passed", "Sample OK");
    expect(insp.inspection.status).toBe("passed");
  });

  it("raising a dispute flips status to disputed", async () => {
    const c = await make();
    await contractService.accept(c.id);
    const d = await contractService.raiseDispute(c.id, "Quality mismatch");
    expect(d.status).toBe("disputed");
    expect(d.disputeNote).toBe("Quality mismatch");
  });
});
