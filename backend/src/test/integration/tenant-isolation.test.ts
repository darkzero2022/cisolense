import { describe, expect, it } from "vitest";
import { loginAs, prisma, createVciso, seedMinimalFramework } from "../helpers";

describe("tenant isolation", () => {
  it("vCISO sees only own clients and cannot access other tenant resources", async () => {
    const password = "Demo1234!";
    const userA = await createVciso("a@cisolens.io", password);
    const userB = await createVciso("b@cisolens.io", password);

    const orgA = await prisma.clientOrg.create({
      data: {
        name: "Org A",
        shortCode: "OA",
        sector: "Finance",
        vcisoId: userA.id,
      },
    });

    const orgB = await prisma.clientOrg.create({
      data: {
        name: "Org B",
        shortCode: "OB",
        sector: "Retail",
        vcisoId: userB.id,
      },
    });

    const framework = await seedMinimalFramework();
    const assessmentB = await prisma.assessment.create({
      data: {
        clientOrgId: orgB.id,
        frameworkId: framework.id,
        createdById: userB.id,
        status: "IN_PROGRESS",
      },
    });

    const evidenceB = await prisma.evidenceFile.create({
      data: {
        clientOrgId: orgB.id,
        controlRef: "T1.1",
        frameworkRef: "TEST",
        fileName: "evidence.txt",
        fileSize: 10,
        mimeType: "text/plain",
        storagePath: "missing-test-file.txt",
        uploadedById: userB.id,
        status: "SUBMITTED",
      },
    });

    const agentA = await loginAs(userA.email, password);

    const clients = await agentA.get("/api/clients");
    expect(clients.status).toBe(200);
    expect(clients.body.orgs).toHaveLength(1);
    expect(clients.body.orgs[0].id).toBe(orgA.id);

    const forbiddenAssessment = await agentA.get(`/api/assessments/${assessmentB.id}`);
    expect(forbiddenAssessment.status).toBe(404);

    const forbiddenReview = await agentA.patch(`/api/evidence/${evidenceB.id}/review`).send({ status: "ACCEPTED" });
    expect(forbiddenReview.status).toBe(404);
  });
});
