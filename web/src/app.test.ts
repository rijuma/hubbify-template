import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "./app.js";

let server: http.Server;
let port: number;

before(async () => {
  server = createApp();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  port = (server.address() as AddressInfo).port;
});

after(() => {
  server.close();
});

function get(path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request({ port, path }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on("error", reject);
    req.end();
  });
}

describe("path traversal", () => {
  for (const path of [
    "/../../proc/self/environ",
    "/../package.json",
    "/..%2f..%2fpackage.json",
  ]) {
    it(`does not serve ${path}`, async () => {
      const { status, body } = await get(path);
      assert.notEqual(status, 200);
      assert.doesNotMatch(body, /"devDependencies"|PATH=/);
    });
  }
});

describe("public files", () => {
  for (const path of ["/", "/style.css", "/style.css?v=1", "/health"]) {
    it(`serves ${path}`, async () => {
      const { status } = await get(path);
      assert.equal(status, 200);
    });
  }
});
