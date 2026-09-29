import { vi } from "vitest";

const Credentials = vi.fn((config: unknown) => ({
  ...(config as object),
  id: "credentials",
  type: "credentials",
}));

export default Credentials;