import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);

const requested =
  process.env.AP_TEST_BROWSERS === "all"
    ? ["chromium", "firefox", "webkit"]
    : (process.env.AP_TEST_BROWSERS ?? "chromium").split(",");
const browsers = requested.map((name) => {
  if (name !== "chromium" && name !== "firefox" && name !== "webkit")
    throw new Error(`Unknown AP_TEST_BROWSERS entry: ${name}`);
  return name;
});

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 2,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    viewport: { width: 1440, height: 1000 },
    colorScheme: "dark",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: browsers.map((name) => ({
    name,
    use: {
      browserName: name,
      launchOptions:
        name === "chromium" ? { executablePath, args: ["--no-sandbox"] } : {},
    },
  })),
  webServer: {
    command: "npm run dev -- --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
  },
});
