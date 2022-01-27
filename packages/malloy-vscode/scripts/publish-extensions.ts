/*
 * Copyright 2021 Google LLC
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * version 2 as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 */
/* eslint-disable no-console */

import { doBuild, outDir } from "./build-extension";
import * as semver from "semver";
import * as fs from "fs";
import * as path from "path";
import { createVSIX, publish, ICreateVSIXOptions } from "vsce";

const args = process.argv.slice(2);
const version = args[0];
if (!semver.valid(version)) {
  console.error("invalid version number");
  process.exit(1);
}

async function publishExtensions() {
  // const targets = [
  //   "linux-x64",
  //   "linux-arm64",
  //   "linux-armhf",
  //   "alpine-x64",
  //   "alpine-arm64",
  //   ["darwin-x64", "keytar-v7.7.0-napi-v3-darwin-x64.node"],
  //   ["darwin-arm64", "keytar-v7.7.0-napi-v3-darwin-arm64.node"],
  // ];

  const targets = [["darwin-x64", "keytar-v7.7.0-napi-v3-darwin-x64.node"]];

  for (const [target, filename] of targets) {
    await doBuild();

    // copy target-specific keytar binary into build
    fs.copyFileSync(
      path.join(
        "..",
        "..",
        "third_party",
        "github.com",
        "atom",
        "node-keytar",
        filename
      ),
      path.join(outDir, "keytar-native")
    );

    const vsixOptions: ICreateVSIXOptions = {
      githubBranch: "main",
      preRelease: false,
      useYarn: true,
      target,
      packagePath: path.join(outDir, `malloy-vscode-${target}-${version}`),
    };
    await createVSIX(vsixOptions);
  }
}

publishExtensions();
