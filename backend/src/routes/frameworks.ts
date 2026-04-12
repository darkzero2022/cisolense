import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req: AuthRequest, res: Response): Promise<void> => {
  const frameworks = await prisma.framework.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  res.json({ frameworks });
});

router.get("/:id/questions", async (req: AuthRequest, res: Response): Promise<void> => {
  const fw = await prisma.framework.findUnique({
    where: { id: req.params.id },
    include: {
      domains: {
        orderBy: { order: "asc" },
        include: {
          controls: {
            orderBy: { order: "asc" },
            include: { questions: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });
  if (!fw) { res.status(404).json({ error: "Framework not found" }); return; }
  res.json({ framework: fw });
});

export default router;
