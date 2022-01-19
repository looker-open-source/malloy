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

import { BigQueryConnection } from "@malloy-lang/db-bigquery";
import { PostgresConnection } from "@malloy-lang/db-postgres";
import { Connection, FixedConnectionMap } from "@malloy-lang/malloy";
import { getPassword } from "keytar";
import {
  ConnectionBackend,
  ConnectionConfig,
} from "./connection_manager_types";

export class ConnectionManager {
  private _connections: FixedConnectionMap;

  constructor(initialConnectionsConfig: ConnectionConfig[]) {
    this._connections = new FixedConnectionMap(new Map());
    this.buildConnectionMap(initialConnectionsConfig).then((map) => {
      this._connections = map;
    });
  }

  public get connections(): FixedConnectionMap {
    return this._connections;
  }

  private async buildConnectionMap(
    connectionsConfig: ConnectionConfig[]
  ): Promise<FixedConnectionMap> {
    const map = new Map<string, Connection>();
    map.set(
      "bigquery",
      new BigQueryConnection("bigquery", {
        pageSize: 50,
      })
    );
    map.set("postgres", new PostgresConnection("postgres"));
    for (const connectionConfig of connectionsConfig) {
      map.set(
        connectionConfig.name,
        await this.connectionForConfig(connectionConfig)
      );
    }
    // TODO allow changing the default connection
    return new FixedConnectionMap(map, "bigquery");
  }

  public async setConnectionsConfig(
    connectionsConfig: ConnectionConfig[]
  ): Promise<void> {
    this._connections = await this.buildConnectionMap(connectionsConfig);
  }

  public async connectionForConfig(
    connectionConfig: ConnectionConfig
  ): Promise<Connection> {
    switch (connectionConfig.backend) {
      case ConnectionBackend.BigQuery:
        return new BigQueryConnection(
          connectionConfig.name,
          {
            pageSize: 50,
          },
          {
            defaultProject: connectionConfig.projectName,
            serviceAccountKeyPath: connectionConfig.serviceAccountKeyPath,
          }
        );
      case ConnectionBackend.Postgres: {
        let password;
        if (connectionConfig.password !== undefined) {
          password = connectionConfig.password;
        } else if (connectionConfig.useKeychainPassword) {
          password =
            (await getPassword(
              "com.malloy-lang.vscode-extension",
              `connections.${connectionConfig.id}.password`
            )) || undefined;
        }
        return new PostgresConnection(connectionConfig.name, {
          username: connectionConfig.username,
          host: connectionConfig.host,
          password,
          port: connectionConfig.port,
          databaseName: connectionConfig.databaseName,
        });
      }
    }
  }
}