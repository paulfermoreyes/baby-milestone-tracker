import config from "./apps/web/playwright.config";

export default {
  ...config,
  testDir: "./apps/web/tests",
  outputDir: "./apps/web/test-results",
  reporter: [
    ["html", { outputFolder: "apps/web/playwright-report" }],
    ["list"],
  ],
  webServer: config.webServer
    ? {
        ...config.webServer,
        cwd: "./apps/web",
      }
    : undefined,
};
