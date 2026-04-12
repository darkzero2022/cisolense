import { describe, expect, it } from "vitest";
import { loginAs, prisma, createVciso } from "../helpers";

async function seedNistLikeFramework() {
  return prisma.framework.create({
    data: {
      slug: "nist-test",
      name: "NIST Test",
      shortName: "NIST",
      version: "2.0",
      description: "NIST test",
      domains: {
        create: [
          {
            code: "GV",
            name: "Govern",
            order: 1,
            controls: {
              create: [
                {
                  controlId: "GV.OC-01",
                  title: "Cybersecurity Policy",
                  description: "Policy",
                  order: 1,
                  questions: {
                    create: [
                      {
                        text: "Is policy documented?",
                        options: JSON.stringify([
                          { value: 0, label: "No" },
                          { value: 1, label: "Initial" },
                          { value: 2, label: "Partial" },
                          { value: 3, label: "Full" },
                        ]),
                        order: 1,
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    include: { domains: { include: { controls: { include: { questions: true } } } } },
  });
}

describe("assessment flow", () => {
  it("creates, answers, completes, and generates actions", async () => {
    const password = "Demo1234!";
    const user = await createVciso("assess@cisolens.io", password);
    const org = await prisma.clientOrg.create({
      data: {
        name: "Assess Org",
        shortCode: "AS",
        sector: "Finance",
        vcisoId: user.id,
      },
    });
    const framework = await seedNistLikeFramework();
    const control = framework.domains[0].controls[0];
    const question = control.questions[0];

    const agent = await loginAs(user.email, password);

    const start = await agent.post("/api/assessments").send({ clientOrgId: org.id, frameworkId: framework.id });
    expect([200, 201]).toContain(start.status);
    const assessmentId = start.body.assessment.id as string;

    const answer1 = await agent.post(`/api/assessments/${assessmentId}/answer`).send({
      questionId: question.id,
      controlId: control.id,
      value: 1,
    });
    expect(answer1.status).toBe(200);

    const answer2 = await agent.post(`/api/assessments/${assessmentId}/answer`).send({
      questionId: question.id,
      controlId: control.id,
      value: 0,
    });
    expect(answer2.status).toBe(200);

    const complete = await agent.post(`/api/assessments/${assessmentId}/complete`).send();
    expect(complete.status).toBe(200);
    expect(complete.body.assessment.status).toBe("COMPLETE");
    expect(complete.body.assessment.domainScores.length).toBeGreaterThan(0);
    expect(complete.body.assessment.actions.length).toBeGreaterThan(0);
    expect(complete.body.assessment.actions[0].frameworkRef).toBe("GV.OC-01");

    const completeAgain = await agent.post(`/api/assessments/${assessmentId}/complete`).send();
    expect(completeAgain.status).toBe(400);

    const del = await agent.delete(`/api/assessments/${assessmentId}`);
    expect(del.status).toBe(200);
  });
});
