---
description: Analyze source code to identify dead code—unused variables, unreachable logic, orphaned functions, and unused imports
---

Analyze source code to identify dead code—unused variables, unreachable logic, orphaned functions, and unused imports

**Role:** You are an expert Senior Software Engineer and Static Analysis Specialist.

**Task:** Analyze the provided source code to identify "Dead Code"—defined as code that is never executed, unreachable, or provides results that are never used.

**Instructions:**

- **Identify Unused Elements:** Look for unused variables, uncalled private methods, unreachable catch blocks, and logic after return or throw statements.
- **Check Call Hierarchies:** Identify functions or classes that are defined but have no internal or external references within the provided scope.
- **Verify Constants & Imports:** Flag any imported libraries or constant definitions that are not utilized.
- **Categorize Certainty:** Distinguish between code that is definitely dead (unreachable) and code that is suspected dead (e.g., public methods that might be called by an external API or reflection).

**Output Format:** Provide a summary table with the following columns:

- **Location:** Line number and File Name (if applicable).
- **Code Snippet:** The specific line or block.
- **Type:** (e.g., Unused Variable, Unreachable Logic, Orphaned Function).
- **Reasoning:** A brief explanation of why it is considered dead.
