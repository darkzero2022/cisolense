import { describe, expect, it } from "vitest";
import { createVciso, loginAs, prisma } from "../helpers";

describe("evidence lifecycle", () => {
  it("supports upload, review, resubmit, bulk review, download, and delete", async () => {
    const password = "Demo1234!";
    const user = await createVciso("evidence@cisolens.io", password);
    const org = await prisma.clientOrg.create({
      data: {
        name: "Evidence Org",
        shortCode: "EV",
        sector: "Healthcare",
        vcisoId: user.id,
      },
    });

    const agent = await loginAs(user.email, password);

    const upload = await agent
      .post("/api/evidence")
      .field("clientOrgId", org.id)
      .field("controlRef", "GV.OC-01")
      .field("frameworkRef", "NIST")
      .attach("file", Buffer.from("sample evidence content"), "evidence.txt");

    expect(upload.status).toBe(201);
    const fileId = upload.body.file.id as string;

    const reject = await agent.patch(`/api/evidence/${fileId}/review`).send({ status: "REJECTED", reviewNote: "Need clearer evidence" });
    expect(reject.status).toBe(200);
    expect(reject.body.file.status).toBe("REJECTED");

    const resubmit = await agent.patch(`/api/evidence/${fileId}/resubmit`).send();
    expect(resubmit.status).toBe(200);
    expect(resubmit.body.file.status).toBe("SUBMITTED");

    const accept = await agent.patch(`/api/evidence/${fileId}/review`).send({ status: "ACCEPTED" });
    expect(accept.status).toBe(200);
    expect(accept.body.file.status).toBe("ACCEPTED");

    const upload2 = await agent
      .post("/api/evidence")
      .field("clientOrgId", org.id)
      .field("controlRef", "GV.OC-01")
      .field("frameworkRef", "NIST")
      .attach("file", Buffer.from("second file"), "evidence2.txt");
    const upload3 = await agent
      .post("/api/evidence")
      .field("clientOrgId", org.id)
      .field("controlRef", "GV.OC-01")
      .field("frameworkRef", "NIST")
      .attach("file", Buffer.from("third file"), "evidence3.txt");

    expect(upload2.status).toBe(201);
    expect(upload3.status).toBe(201);

    const bulk = await agent.patch("/api/evidence/bulk-review").send({
      ids: [upload2.body.file.id, upload3.body.file.id],
      status: "ACCEPTED",
    });
    expect(bulk.status).toBe(200);
    expect(bulk.body.files).toHaveLength(2);

    const download = await agent.get(`/api/evidence/${fileId}/download`);
    expect(download.status).toBe(200);
    expect(download.headers["content-type"]).toContain("text/plain");

    const del = await agent.delete(`/api/evidence/${fileId}`);
    expect(del.status).toBe(200);
    expect(del.body.ok).toBe(true);
  });
});
