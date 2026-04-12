import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";

const prisma = new PrismaClient();

async function resetDb() {
  await prisma.assessmentAnswer.deleteMany();
  await prisma.domainScore.deleteMany();
  await prisma.action.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.evidenceFile.deleteMany();
  await prisma.evidenceRequest.deleteMany();
  await prisma.orgFramework.deleteMany();
  await prisma.control.deleteMany();
  await prisma.domain.deleteMany();
  await prisma.framework.deleteMany();
  await prisma.clientOrg.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

beforeAll(() => {
  execSync("npx prisma db push --skip-generate", { stdio: "ignore" });
});

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});
