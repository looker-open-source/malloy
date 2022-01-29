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

import { TestTranslator } from "../test-translator";
import { DocumentSymbol } from "./document-symbol-walker";

class MalloyExplore {
  tt: TestTranslator;
  constructor(src: string) {
    this.tt = new TestTranslator(src);
  }

  get symbols(): DocumentSymbol[] {
    const md = this.tt.metadata();
    return md.symbols || [];
  }
}

test("explore symbols are included", () => {
  const doc = new MalloyExplore(
    "explore: flights is table('my.table.flights')"
  );
  expect(doc.symbols).toMatchObject([
    {
      children: [],
      name: "flights",
      range: {
        end: { line: 0, character: 45 },
        start: { line: 0, character: 9 },
      },
      type: "explore",
    },
  ]);
});

test("query symbols are included", () => {
  const doc = new MalloyExplore(
    "query: flights_by_carrier is flights -> by_carrier"
  );
  expect(doc.symbols).toMatchObject([
    {
      children: [],
      name: "flights_by_carrier",
      range: {
        end: { line: 0, character: 50 },
        start: { line: 0, character: 7 },
      },
      type: "query",
    },
  ]);
});

test.skip("expression field defs are included", () => {
  const doc = new MalloyExplore(
    "explore: flights is table('my.table.flights')) {\n" +
      "  dimension: one is 1\n" +
      "}"
  );
  expect(doc.symbols).toMatchObject([
    {
      children: [
        {
          name: "one",
          range: {
            start: { line: 1, character: 2 },
            end: { line: 1, character: 10 },
          },
          type: "field",
        },
      ],
      name: "flights",
      range: {
        start: { line: 0, character: 0 },
        end: { line: 2, character: 1 },
      },
      type: "explore",
    },
  ]);
});

test.skip("renamed fields are included", () => {
  const doc = new MalloyExplore(
    "explore: flights is table('my.table.flights') {\n" +
      "  dimension: field_two renames field_2\n" +
      "};"
  );
  expect(doc.symbols).toMatchObject([
    {
      children: [
        {
          name: "field_two",
          range: {
            start: { line: 1, character: 2 },
            end: { line: 1, character: 27 },
          },
          type: "field",
        },
      ],
      name: "flights",
      range: {
        start: { line: 0, character: 0 },
        end: { line: 2, character: 1 },
      },
      type: "explore",
    },
  ]);
});

test.skip("name only fields are included", () => {
  const doc = new MalloyExplore(
    "explore: flights is table('my.table.flights') {\n" +
      "  dmension: field_two is field_2\n" +
      "};"
  );
  expect(doc.symbols).toMatchObject([
    {
      children: [
        {
          name: "field_two",
          range: {
            start: { line: 1, character: 2 },
            end: { line: 1, character: 22 },
          },
          type: "field",
        },
      ],
    },
  ]);
});

test.skip("turtle fields are included", () => {
  const doc = new MalloyExplore(
    "explore: flights is table('my.table.flights') {\n" +
      "  query: my_turtle is { group_by: a }\n" +
      "}"
  );
  expect(doc.symbols).toMatchObject([
    {
      children: [
        {
          name: "my_turtle",
          range: {
            start: { line: 1, character: 2 },
            end: { line: 1, character: 25 },
          },
          type: "turtle",
        },
      ],
    },
  ]);
});

test.skip("turtle children fields are included", () => {
  const doc = new MalloyExplore(
    "explore: flights is table('my.table.flights') {\n" +
      "  query: my_turtle is { group_by: a a}\n" +
      "}"
  );
  expect(doc.symbols).toMatchObject([
    {
      children: [
        {
          name: "my_turtle",
          children: [
            {
              name: "a",
              range: {
                start: { line: 1, character: 23 },
                end: { line: 1, character: 24 },
              },
              type: "field",
            },
          ],
        },
      ],
    },
  ]);
});

test.skip("turtle children turtles are included", () => {
  const doc = new MalloyExplore(
    "explore: flights is table('my.table.flights') {\n" +
      "  query: my_turtle is { nest: inner_turtle is { group_by: a }}\n" +
      "}"
  );
  expect(doc.symbols).toMatchObject([
    {
      children: [
        {
          name: "my_turtle",
          children: [
            {
              name: "inner_turtle",
              range: {
                start: { line: 1, character: 23 },
                end: { line: 1, character: 49 },
              },
              type: "turtle",
              children: [
                {
                  name: "a",
                  range: {
                    start: { line: 1, character: 47 },
                    end: { line: 1, character: 48 },
                  },
                  type: "field",
                },
              ],
            },
          ],
        },
      ],
    },
  ]);
});

test.skip("joins are included", () => {
  const doc = new MalloyExplore(
    "explore: flights is table('my.table.flights') {\n" +
      " join_one: a is b with c\n" +
      "}"
  );
  expect(doc.symbols).toMatchObject([
    {
      children: [
        {
          name: "a",
          range: {
            start: { line: 1, character: 2 },
            end: { line: 1, character: 18 },
          },
          type: "join",
        },
      ],
    },
  ]);
});

test.skip("join ons in join section are included", () => {
  const doc = new MalloyExplore(
    "explore: flights is table('my.table.flights') {\n" +
      " join_one: a with b\n" +
      "}"
  );
  expect(doc.symbols).toMatchObject([
    {
      children: [
        {
          name: "a",
          range: {
            start: { line: 1, character: 8 },
            end: { line: 1, character: 14 },
          },
          type: "join",
        },
      ],
    },
  ]);
});

test.skip("join sources in join section are included", () => {
  const doc = new MalloyExplore(
    "explore: flights is table('my.table.flights') {\n" +
      " join_one: a is b with c\n" +
      "}"
  );
  expect(doc.symbols).toMatchObject([
    {
      children: [
        {
          name: "a",
          range: {
            start: { line: 1, character: 8 },
            end: { line: 1, character: 19 },
          },
          type: "join",
        },
      ],
    },
  ]);
});
