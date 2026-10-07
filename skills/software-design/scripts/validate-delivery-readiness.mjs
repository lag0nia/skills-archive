#!/usr/bin/env node

import { runBuildValidationCommand } from "./lib/validation/run-build-validation-command.mjs";

runBuildValidationCommand({ argv: process.argv, scope: "delivery" });
