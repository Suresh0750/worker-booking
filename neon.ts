import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Object Storage
  buckets: {
    uploads: {},
  },

  // Managed Better Auth disabled
  auth: false,

  // Branch policy
  branch: (branch) => {
    if (branch.isDefault) {
      return {};
    }

    if (!branch.exists) {
      return { ttl: "7d" };
    }

    return {};
  },
});
