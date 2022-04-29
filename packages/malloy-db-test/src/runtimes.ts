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

import {
  EmptyURLReader,
  Result,
  MalloyQueryData,
  SingleConnectionRuntime,
} from "@malloydata/malloy";
import { BigQueryConnection } from "@malloydata/db-bigquery";
import { PostgresConnection } from "@malloydata/db-postgres";

export class BigQueryTestConnection extends BigQueryConnection {
  // we probably need a better way to do this.

  public async runSQL(sqlCommand: string): Promise<MalloyQueryData> {
    try {
      return await super.runSQL(sqlCommand);
    } catch (e) {
      console.log(`Error in SQL:\n ${sqlCommand}`);
      throw e;
    }
  }
}

export class PostgresTestConnection extends PostgresConnection {
  // we probably need a better way to do this.

  public async runSQL(sqlCommand: string): Promise<MalloyQueryData> {
    try {
      return await super.runSQL(sqlCommand);
    } catch (e) {
      console.log(`Error in SQL:\n ${sqlCommand}`);
      throw e;
    }
  }
}

const files = new EmptyURLReader();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rows(qr: Result): any[] {
  return qr.data.value;
}

const allDatabases = ["postgres", "bigquery"];
type RuntimeDatabaseNames = typeof allDatabases[number];

export class RuntimeList {
  bqConnection = new BigQueryTestConnection(
    "bigquery",
    {},
    { defaultProject: "malloy-data" }
  );
  postgresConnection = new PostgresTestConnection(
    "postgres",
    {},
    { defaultSchema: "public" }
  );
  runtimeMap = new Map<string, SingleConnectionRuntime>();

  constructor(databaseList: RuntimeDatabaseNames[] | undefined = undefined) {
    for (const dbName of databaseList || allDatabases) {
      switch (dbName) {
        case "bigquery":
          this.runtimeMap.set(
            "bigquery",
            new SingleConnectionRuntime(files, this.bqConnection)
          );
          break;
        case "postgres": {
          this.runtimeMap.set(
            "postgres",
            new SingleConnectionRuntime(files, this.postgresConnection)
          );
        }
      }
    }
  }

  async closeAll(): Promise<void> {
    for (const [_key, runtime] of this.runtimeMap) {
      if (runtime.connection.isPool()) runtime.connection.drain();
    }
  }
}
