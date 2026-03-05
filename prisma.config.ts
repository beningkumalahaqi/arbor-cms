import path from "node:path";
import { defineConfig } from "prisma/config";

const baseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

// For Turso, append authToken to the URL so the migration engine can authenticate
const urlWithAuth =
  authToken && baseUrl.startsWith("libsql://")
    ? `${baseUrl}?authToken=${authToken}`
    : baseUrl;

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: urlWithAuth,
  },
});
