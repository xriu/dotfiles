---
name: prune-comments
description: Read-only comment audit. Swarms the repo with the no-comments rules and returns one plan that splits workaround comments into refactor work and plain deletes.
disable-model-invocation: true
---

/poteto-mode to spawn a /swarm to use /no-comments and identify useless code comments we can prune in my repo. come back with a high level plan of which of these workarounds would be best solved by refactoring and which we can straight up delete
