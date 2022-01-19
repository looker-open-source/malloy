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

import { Explore, Field } from "@malloydata/malloy";
import { HTMLListRenderer } from "./list";

export class HTMLListDetailRenderer extends HTMLListRenderer {
  getDetailField(explore: Explore): Field | undefined {
    return explore.intrinsicFields[1];
  }
}
