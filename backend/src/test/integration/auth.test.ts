import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../index";

describe("auth integration", () => {
  it("register -> me returns created user", async () => {
    const agent = request.agent(app);

    const register = await agent.post("/api/auth/register").send({
      email: "auth-test@cisolens.io",
      password: "Demo1234!",
      firstName: "Auth",
      lastName: "Tester",
    });

    expect(register.status).toBe(201);
    expect(register.body.user.email).toBe("auth-test@cisolens.io");

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("auth-test@cisolens.io");
  });

  it("refresh token rotation invalidates old refresh token", async () => {
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      email: "rotate@cisolens.io",
      password: "Demo1234!",
      firstName: "Rotate",
      lastName: "Tester",
    });

    const login = await request(app).post("/api/auth/login").send({
      email: "rotate@cisolens.io",
      password: "Demo1234!",
    });
    expect(login.status).toBe(200);

    const cookies = (login.headers["set-cookie"] || []) as string[];
    const refreshCookie = cookies.find((c) => c.startsWith("refresh_token="));
    expect(refreshCookie).toBeTruthy();
    const refresh = refreshCookie!.split(";")[0];

    const firstRefresh = await request(app).post("/api/auth/refresh").set("Cookie", refresh);
    expect(firstRefresh.status).toBe(200);

    const secondRefreshWithOld = await request(app).post("/api/auth/refresh").set("Cookie", refresh);
    expect(secondRefreshWithOld.status).toBe(401);
  });
});
