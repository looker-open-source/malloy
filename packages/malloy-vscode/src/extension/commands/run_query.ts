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

import * as vscode from "vscode";
import { MALLOY_EXTENSION_STATE } from "../state";
import { QueryRenderMode } from "../webview_message_manager";
import { runMalloyQuery } from "./run_query_utils";

export function runQueryCommand(
  query: string,
  name?: string,
  renderMode: QueryRenderMode = QueryRenderMode.HTML
): void {
  const document =
    vscode.window.activeTextEditor?.document ||
    MALLOY_EXTENSION_STATE.getActiveWebviewPanel()?.document;
  if (document) {
    runMalloyQuery(
      { type: "string", text: query, file: document },
      `${document.uri.toString()} ${name}`,
      name || document.uri.toString(),
      renderMode
    );
  }
}
