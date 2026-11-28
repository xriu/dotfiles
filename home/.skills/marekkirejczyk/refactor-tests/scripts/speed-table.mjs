#!/usr/bin/env node
// Turns the logs of speed-reporter.mjs into a Markdown table of test time per category.
//
//   node speed-table.mjs --map <map.json> <pass.log> [<rerun.log>...]
//   node speed-table.mjs --map <map.json> --over <pass.log>
//
// The table's times come from the pass. A test found in the reruns is judged
// against its budget by its median there, so one noisy pass can't flag it.
// --over prints the test files to re-run, one per line.
import { readFileSync } from "node:fs";

const NO_VALUE = "—";
const UNCLASSIFIED = "Unclassified";

function parseArguments(argv) {
  const logs = [];
  let mapPath;
  let listOverBudgetFiles = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--map") mapPath = argv[++i];
    else if (argv[i] === "--over") listOverBudgetFiles = true;
    else logs.push(argv[i]);
  }
  if (!mapPath || logs.length === 0) {
    throw new Error("Usage: speed-table.mjs --map <map.json> [--over] <pass.log> [<rerun.log>...]");
  }
  return { mapPath, listOverBudgetFiles, passPath: logs[0], rerunPaths: logs.slice(1) };
}

function parseLog(path) {
  const setupMsByFile = new Map();
  const tests = [];
  const occurrencesOfName = new Map();
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const fileLine = line.match(/^file_ms (\S+) (.+)$/);
    const testLine = line.match(/^test_ms (\S+) (.+?) > (.*)$/);
    if (fileLine) {
      setupMsByFile.set(fileLine[2], Number(fileLine[1]));
    } else if (testLine) {
      const name = `${testLine[2]} > ${testLine[3]}`;
      const occurrence = occurrencesOfName.get(name) ?? 0;
      occurrencesOfName.set(name, occurrence + 1);
      tests.push({ id: `${name}#${occurrence}`, file: testLine[2], ms: Number(testLine[1]) });
    }
  }
  return { setupMsByFile, tests };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function medianMsByTest(rerunLogs) {
  const samplesByTest = new Map();
  for (const { tests } of rerunLogs) {
    for (const { id, ms } of tests) samplesByTest.set(id, [...(samplesByTest.get(id) ?? []), ms]);
  }
  return new Map([...samplesByTest].map(([id, samples]) => [id, median(samples)]));
}

function formatDuration(ms) {
  if (ms < 9.95) return `${Number(ms.toFixed(1))} ms`;
  if (ms < 999.5) return `${Math.round(ms)} ms`;
  if (ms < 59_950) return `${(ms / 1000).toFixed(1)} sec`;
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 3600) return `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}sec`;
  const totalMinutes = Math.round(totalSeconds / 60);
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

function formatPercent(part, whole) {
  return whole === 0 ? NO_VALUE : `${((part / whole) * 100).toFixed(1)}%`;
}

function categoryOf(file, map, declaredNames) {
  const category = map.files[file] ?? UNCLASSIFIED;
  if (category !== UNCLASSIFIED && !declaredNames.has(category)) {
    throw new Error(`${file} is mapped to "${category}", which the map's categories don't declare`);
  }
  return category;
}

function emptyRow(name, budgetMs) {
  return { name, budgetMs, totalMs: 0, setupMs: 0, tests: 0, testsMs: 0, overBudget: 0 };
}

function rowsByCategory(pass, map, medians) {
  const declaredNames = new Set(map.categories.map((category) => category.name));
  const rows = new Map(map.categories.map(({ name, budget_ms }) => [name, emptyRow(name, budget_ms)]));
  rows.set(UNCLASSIFIED, emptyRow(UNCLASSIFIED));

  for (const [file, setupMs] of pass.setupMsByFile) {
    const row = rows.get(categoryOf(file, map, declaredNames));
    row.setupMs += setupMs;
    row.totalMs += setupMs;
  }
  for (const test of pass.tests) {
    const row = rows.get(categoryOf(test.file, map, declaredNames));
    row.tests += 1;
    row.testsMs += test.ms;
    row.totalMs += test.ms;
    if (row.budgetMs !== undefined && (medians.get(test.id) ?? test.ms) > row.budgetMs) row.overBudget += 1;
  }
  return [...rows.values()].filter((row) => row.tests > 0 || row.setupMs > 0);
}

function allCategoriesRow(rows) {
  const all = emptyRow("All");
  for (const row of rows) {
    all.totalMs += row.totalMs;
    all.setupMs += row.setupMs;
    all.tests += row.tests;
    all.testsMs += row.testsMs;
    all.overBudget += row.overBudget;
  }
  return all;
}

function tableLine(cells) {
  return `| ${cells.join(" | ")} |`;
}

function rowCells(row, suiteMs, testsWithABudget) {
  const hasBudget = row.budgetMs !== undefined;
  const isAll = row.name === "All";
  return [
    row.name,
    formatDuration(row.totalMs),
    formatDuration(row.setupMs),
    formatPercent(row.totalMs, suiteMs),
    String(row.tests),
    row.tests === 0 ? NO_VALUE : formatDuration(row.testsMs / row.tests),
    hasBudget ? formatDuration(row.budgetMs) : NO_VALUE,
    hasBudget || (isAll && testsWithABudget > 0) ? String(row.overBudget) : NO_VALUE,
    hasBudget ? formatPercent(row.overBudget, row.tests) : isAll ? formatPercent(row.overBudget, testsWithABudget) : NO_VALUE,
  ];
}

function markdownTable(rows) {
  const all = allCategoriesRow(rows);
  const testsWithABudget = rows.reduce((sum, row) => sum + (row.budgetMs === undefined ? 0 : row.tests), 0);
  const header = ["Category", "Total", "Setup", "Time share", "Tests", "Avg per test", "Budget", "Over budget", "% over budget"];
  return [
    tableLine(header),
    tableLine(header.map(() => "---")),
    ...[...rows, all].map((row) => tableLine(rowCells(row, all.totalMs, testsWithABudget))),
  ].join("\n");
}

function filesToRerun(pass, map) {
  const declaredNames = new Set(map.categories.map((category) => category.name));
  const budgetOfCategory = new Map(map.categories.map(({ name, budget_ms }) => [name, budget_ms]));
  const files = new Set();
  for (const test of pass.tests) {
    const budgetMs = budgetOfCategory.get(categoryOf(test.file, map, declaredNames));
    if (budgetMs !== undefined && test.ms > budgetMs) files.add(test.file);
  }
  for (const [file, setupMs] of pass.setupMsByFile) {
    if (map.file_budget_ms !== undefined && setupMs > map.file_budget_ms) files.add(file);
  }
  return [...files];
}

const { mapPath, listOverBudgetFiles, passPath, rerunPaths } = parseArguments(process.argv.slice(2));
const map = JSON.parse(readFileSync(mapPath, "utf8"));
const pass = parseLog(passPath);

if (listOverBudgetFiles) {
  console.log(filesToRerun(pass, map).join("\n"));
} else {
  console.log(markdownTable(rowsByCategory(pass, map, medianMsByTest(rerunPaths.map(parseLog)))));
}
