// A Playwright reporter: what each test costs, in the format of speed-reporter.mjs.
// test_ms includes the test's beforeEach, afterEach and test-scoped fixtures.
// It prints no file_ms: Playwright's per-file cost is what `webServer` and worker
// fixtures pay, and neither is split out per file.
import { relative } from "node:path";

export default class PlaywrightSpeedReporter {
  onBegin(config) {
    this.rootDir = config.rootDir;
  }

  onTestEnd(test, result) {
    if (result.status === "skipped") return;
    const file = relative(this.rootDir, test.location.file);
    const titlesBelowFile = test.titlePath().slice(3);
    console.log(`test_ms ${result.duration.toFixed(1)} ${file} > ${titlesBelowFile.join(" > ")}`);
  }

  printsToStdio() {
    return true;
  }
}
