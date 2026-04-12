import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
p.user.findMany().then(users => {
  console.log(JSON.stringify(users, null, 2));
  p.$disconnect();
});
