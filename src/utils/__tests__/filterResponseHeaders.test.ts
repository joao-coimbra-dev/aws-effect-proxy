import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { filterResponseHeaders } from "@utils/filterResponseHeaders.js";

describe("filterResponseHeaders", () => {
  it("should filter out excluded headers", () => {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Transfer-Encoding", "chunked");
    headers.append("Connection", "keep-alive");
    headers.append("X-Custom-Header", "custom-value");

    const result = Effect.runSync(filterResponseHeaders(headers));

    expect(result).toStrictEqual({
      "content-type": ["application/json"],
      "x-custom-header": ["custom-value"],
    });
  });

  it("should handle mixed included and excluded headers", () => {
    const headers = new Headers();
    headers.append("Content-Type", "text/html");
    headers.append("Cache-Control", "no-cache");
    headers.append("Connection", "close");
    headers.append("Upgrade", "websocket");
    headers.append("Accept", "application/xml");

    const result = Effect.runSync(filterResponseHeaders(headers));

    expect(result).toStrictEqual({
      "content-type": ["text/html"],
      "cache-control": ["no-cache"],
      accept: ["application/xml"],
    });
  });

  it("should handle multi-value headers", () => {
    const headers = new Headers();
    headers.append("Set-Cookie", "key1=value1");
    headers.append("Set-Cookie", "key2=value2");
    headers.append("X-Forwarded-For", "192.168.1.1");
    headers.append("X-Forwarded-For", "10.0.0.1");

    const result = Effect.runSync(filterResponseHeaders(headers));

    expect(result).toStrictEqual({
      "set-cookie": ["key1=value1", "key2=value2"],
      "x-forwarded-for": ["192.168.1.1", "10.0.0.1"],
    });
  });

  it("should return an empty object for an empty Headers object", () => {
    const headers = new Headers();

    const result = Effect.runSync(filterResponseHeaders(headers));

    expect(result).toStrictEqual({});
  });

  it("should handle case-insensitive header names for exclusion", () => {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("tRaNsFeR-eNcOdInG", "chunked");
    headers.append("CoNnEcTiOn", "keep-alive");
    headers.append("X-Custom-Header", "custom-value");

    const result = Effect.runSync(filterResponseHeaders(headers));

    expect(result).toStrictEqual({
      "content-type": ["application/json"],
      "x-custom-header": ["custom-value"],
    });
  });

  it("should not modify non-excluded headers with different cases", () => {
    const headers = new Headers();
    headers.append("cOnTeNt-TyPe", "application/json"); // Different case, but not excluded
    headers.append("X-My-Header", "value1");
    headers.append("x-my-header", "value2");

    const result = Effect.runSync(filterResponseHeaders(headers));

    expect(result).toStrictEqual({
      "content-type": ["application/json"],
      "x-my-header": ["value1", "value2"],
    });
  });
});
