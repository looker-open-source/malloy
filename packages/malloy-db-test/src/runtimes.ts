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
  Runtime,
  EmptyURLReader,
  Result,
  MalloyQueryData,
} from "@malloy-lang/malloy";
import { BigQueryConnection } from "@malloy-lang/db-bigquery";
import { PooledPostgresConnection } from "@malloy-lang/db-postgres";

import { env } from "process";

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

export class PostgresTestConnection extends PooledPostgresConnection {
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

const bqConnection = new BigQueryTestConnection("bigquery", {}, "malloy-data");
const postgresConnection = new PostgresTestConnection("postgres");
// export the actual connections so that we can access them from test
export const testConnections = [bqConnection, postgresConnection];

const files = new EmptyURLReader();

export function getRuntimes(
  databaseList: string[] | undefined = undefined
): Map<string, Runtime> {
  const runtimes: Map<string, Runtime> = new Map<string, Runtime>(
    Object.entries({
      bigquery: new Runtime(files, bqConnection),
      postgres: new Runtime(files, postgresConnection),
    })
  );

  const testDatabaseEnv = env.MALLOY_TEST_DATABASES;
  // const testDatabaseEnv = "bigquery,postgres";

  let databases;
  if (databaseList !== undefined) {
    databases = databaseList;
  } else if (testDatabaseEnv !== undefined) {
    databases = testDatabaseEnv.split(",");
  } else {
    databases = ["bigquery"];
  }
  for (const key of runtimes.keys()) {
    if (!databases.includes(key)) {
      runtimes.delete(key);
    }
  }
  return runtimes;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rows(qr: Result): any[] {
  return qr.data.value;
}
