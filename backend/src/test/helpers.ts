import bcrypt from "bcryptjs";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { app } from "../index";

export const prisma = new PrismaClient();

export async function createVciso(email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: "Test",
      lastName: "User",
      role: "VCISO",
    },
  });
}

export async function loginAs(email: string, password: string) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.status}`);
  }
  await agent.get("/api/auth/csrf");
  return agent;
}

export async function seedMinimalFramework() {
  return prisma.framework.create({
    data: {
      slug: "test-fw",
      name: "Test Framework",
      shortName: "TEST",
      version: "1.0",
      description: "Test framework",
      domains: {
        create: [
          {
            code: "T1",
            name: "Test Domain",
            order: 1,
            controls: {
              create: [
                {
                  controlId: "T1.1",
                  title: "Test Control",
                  description: "Test control description",
                  order: 1,
                  questions: {
                    create: [
                      {
                        text: "Test question?",
                        options: JSON.stringify([
                          { value: 0, label: "No" },
                          { value: 1, label: "Some" },
                          { value: 2, label: "Mostly" },
                          { value: 3, label: "Yes" },
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
  });
}
