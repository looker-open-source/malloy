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

import * as crypto from "crypto";
import {
  StructDef,
  MalloyQueryData,
  Connection,
  NamedStructDefs,
  AtomicFieldType,
  QueryData,
} from "@malloy-lang/malloy";
import { Client } from "pg";

const postgresToMalloyTypes: { [key: string]: AtomicFieldType } = {
  "character varying": "string",
  name: "string",
  integer: "number",
};

export class PostgresConnection extends Connection {
  private resultCache = new Map<string, MalloyQueryData>();
  private schemaCache = new Map<string, StructDef>();

  constructor(name: string) {
    super(name);
  }

  get dialectName(): string {
    return "postgres";
  }

  public async getSchemaForMissingTables(
    missing: string[]
  ): Promise<NamedStructDefs> {
    const tableStructDefs: NamedStructDefs = {};
    for (const tableName of missing) {
      let inCache = this.schemaCache.get(tableName);
      if (!inCache) {
        inCache = await this.getTableSchema(tableName);
        this.schemaCache.set(tableName, inCache);
      }
      tableStructDefs[tableName] = inCache;
    }
    return tableStructDefs;
  }

  private async runPostgresQuery(
    sqlCommand: string,
    _pageSize: number,
    _rowIndex: number,
    deJson: boolean
  ): Promise<MalloyQueryData> {
    const client = new Client();
    await client.connect();

    let result = await client.query(sqlCommand);
    if (result instanceof Array) {
      result = result.pop();
    }
    if (deJson) {
      for (let i = 0; i < result.rows.length; i++) {
        result.rows[i] = result.rows[i].row;
      }
    }
    await client.end();
    return { rows: result.rows as QueryData, totalRows: result.rows.length };
  }

  private async getTableSchema(tablePath: string): Promise<StructDef> {
    const structDef: StructDef = {
      type: "struct",
      name: tablePath,
      dialect: "postgres",
      structSource: { type: "table" },
      structRelationship: {
        type: "basetable",
        connectionName: "postgres",
      },
      fields: [],
    };

    const [schema, table] = tablePath.split(".");
    if (table === undefined) {
      throw new Error("Default schema not supported Yet in Postgres");
    }
    const result = await this.runPostgresQuery(
      `
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = '${table}'
        AND table_schema = '${schema}'
      `,
      1000,
      0,
      false
    );
    for (const row of result.rows) {
      const malloyType = postgresToMalloyTypes[row["data_type"] as string];
      if (malloyType !== undefined) {
        structDef.fields.push({
          type: malloyType,
          name: row["column_name"] as string,
        });
      }
    }
    return structDef;
  }

  public async runQuery(query: string): Promise<QueryData> {
    const queryData = await this.runPostgresQuery(query, 1000, 0, false);
    return queryData.rows;
  }

  public async runMalloyQuery(
    sqlCommand: string,
    pageSize = 1000,
    rowIndex = 0
  ): Promise<MalloyQueryData> {
    const hash = crypto
      .createHash("md5")
      .update(sqlCommand)
      .update(String(pageSize))
      .update(String(rowIndex))
      .digest("hex");
    let result;
    if ((result = this.resultCache.get(hash)) !== undefined) {
      return result;
    }
    result = await this.runPostgresQuery(sqlCommand, pageSize, rowIndex, true);

    this.resultCache.set(hash, result);
    return result;
  }
}
