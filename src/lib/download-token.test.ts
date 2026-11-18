import { describe, expect, it } from "vitest";
import { createDownloadToken, verifyDownloadToken } from "./download-token";

const id = "f35ac194-1111-4222-8333-444455556666";
describe("download token", () => {
  it("accepts its own token", async () => {
    expect(await verifyDownloadToken("s", await createDownloadToken("s", id))).toBe(id);
  });
  it("rejects a token signed with another secret", async () => {
    expect(await verifyDownloadToken("other", await createDownloadToken("s", id))).toBeNull();
  });
  it("rejects a token moved to another transaction", async () => {
    const sig = (await createDownloadToken("s", id)).split(".")[1];
    expect(await verifyDownloadToken("s", `aaaaaaaa-1111-4222-8333-444455556666.${sig}`)).toBeNull();
  });
});
