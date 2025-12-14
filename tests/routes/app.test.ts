import request from "supertest";
import app from "@/app";

describe("app.ts routes", () => {
  it("/health", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: "OK",
      uptime: expect.any(Number),
      timestamp: expect.any(String)
    });
  });

  it("/api/status", async () => {
    const res = await request(app).get("/api/status");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: "running",
      version: expect.any(String),
      nodeVersion: expect.any(String)
    });
  });

  it("/", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Welcome to Valkku Backend API! 🚀",
      timestamp: expect.any(String),
      environment: expect.any(String)
    });
  });
});