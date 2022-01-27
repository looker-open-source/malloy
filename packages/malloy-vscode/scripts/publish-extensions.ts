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

import * as fs from "fs";
import * as path from "path";
import { publishVSIX } from "vsce";

async function publishExtensions(preRelease?: boolean) {
  const targets = [["darwin-x64", "keytar-v7.7.0-napi-v3-darwin-x64.node"]];

  for (const [target, filename] of targets) {
    //
  }
}

publishExtensions();
