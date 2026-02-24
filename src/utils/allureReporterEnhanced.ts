import AllureVitestReporter from "allure-vitest/reporter";

type TaskLike = {
  type: string;
  mode?: string;
  result?: unknown;
  tasks?: TaskLike[];
};

/**
 * Allure reporter enhancements:
 * - Ensure skipped tests are included in the report.
 *
 * The default allure-vitest reporter omits tests where task.mode === "skip" && !task.result
 * (e.g. describe.skip / it.skip). We inject a minimal result so they are written as skipped.
 */
export default class AllureReporterEnhanced extends AllureVitestReporter {
  override handleTask(task: TaskLike): void {
    // Skipped suites: parent reporter can return without recursing, so we recurse and report each child.
    if (task.type === "suite" && task.mode === "skip" && task.result == null) {
      for (const inner of task.tasks ?? []) {
        this.handleTask(inner);
      }
      return;
    }

    const isSkippedWithoutResult = task.type !== "suite" && task.mode === "skip" && task.result == null;
    const taskToHandle = isSkippedWithoutResult
      ? { ...task, result: { state: "skip" as const, startTime: 0, duration: 0 } }
      : task;

    super.handleTask(taskToHandle as Parameters<AllureVitestReporter["handleTask"]>[0]);
  }
}

