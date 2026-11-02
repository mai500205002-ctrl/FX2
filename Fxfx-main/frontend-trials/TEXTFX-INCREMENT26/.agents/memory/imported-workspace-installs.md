---
name: Imported workspace installs
description: Handling imported monorepos where workspace manifests and package-manager metadata disagree.
---

When an imported workspace's package-manager workspace definition is malformed or does not include a package, avoid broad root installation if it also pulls unrelated desktop or packaging dependencies. Install only the target package in isolation, without rewriting the imported lockfiles, then run the requested project test command.

**Why:** A root install can fail on unrelated desktop packaging dependencies or security-registry restrictions, while a workspace-filtered install may report that the package does not exist.

**How to apply:** Check the workspace manifest and package name, then use the package manager's package-directory install mode when filters do not resolve. Do not weaken registry security checks or commit generated dependency directories.
