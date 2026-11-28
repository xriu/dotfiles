// A Vitest reporter: what each test file and each test costs.
// file_ms runs from the first import to the end of the file's hooks.
// test_ms includes the test's beforeEach and afterEach.
export default class SpeedReporter {
  onTestModuleEnd(testModule) {
    const { setupDuration, collectDuration, duration } = testModule.diagnostic();
    const tests = [...testModule.children.allTests()]
      .filter((test) => test.result().state !== "skipped")
      .map((test) => ({
        name: test.fullName,
        ms: test.diagnostic()?.duration ?? 0,
      }));
    const inTests = tests.reduce((sum, test) => sum + test.ms, 0);
    const fileMs = setupDuration + collectDuration + Math.max(0, duration - inTests);
    console.log(`file_ms ${fileMs.toFixed(1)} ${testModule.relativeModuleId}`);
    for (const test of tests) console.log(`test_ms ${test.ms.toFixed(1)} ${testModule.relativeModuleId} > ${test.name}`);
  }
}
