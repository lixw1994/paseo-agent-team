import { test } from "node:test";
import assert from "node:assert/strict";
import type { PaseoApi } from "@getpaseo/client";
import type { Member } from "../shared/team";
import { paseoRuntime } from "./paseo-runtime";

test("Paseo creates every role without an initial message and keeps standing instructions", async () => {
  type Request = { config: { systemPrompt?: string }; prompt?: string; title?: string };
  const requests: Request[] = [];
  const paseo = { workspaces: { ref: () => ({ agents: { create: async (input: Request) => { requests.push(input); return { id: "created-agent" }; } } }) } } as unknown as PaseoApi;
  const runtime = paseoRuntime(paseo);
  for (const role of ["researcher", "writer", "worker", "custom"] as const) {
    const member: Member = { requestId: "request", role, config: { provider: "test" }, isolation: "worktree", createdAt: new Date().toISOString(), status: "creating", output: "",
      ...(role === "custom" ? { customRole: { name: "QA specialist", instructions: "Report reproducible defects." } } : {}) };
    assert.equal(await runtime.create("workspace", member, "origin"), "created-agent");
    const request = requests.at(-1)!;
    assert.equal(Object.hasOwn(request, "prompt"), false);
    assert.match(request.config.systemPrompt!, /Wait for an explicit user assignment/);
    assert.match(request.config.systemPrompt!, /all openspec\/ and adr\/ edits belong to the Tech Lead/);
    if (role === "custom") {
      assert.equal(request.title, "Agent Team · QA specialist");
      assert.equal(request.config.systemPrompt!.split("Report reproducible defects.").length, 2);
    }
  }
});
