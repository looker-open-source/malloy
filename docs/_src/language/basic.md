# Malloy Quickstart

This guide will introduce the basics of querying and modeling with Malloy.

_Note: If you'd like to follow along with this guide, you can create a new <code>.malloy</code> file and run these queries there._

## Leading with the Source

In Malloy, the source of a query is always first, and can be either a raw table, a [modeled explore](explore.md), or even another query.

To the table function references a table (or view) in the database.  We are explicit about which fields are grouped and which files are aggregated.

```malloy
--! {"isRunnable": true, "runMode": "auto", "isPaginationEnabled": true}
query: table('malloy-data.faa.airports')->{
  group_by: state
  aggregate: airport_count is count()
}
```

To the right of the source, data is piped from one command to the next.

## Projecting and Reducing

In SQL, the <code>SELECT</code> command does two very different things.  A <code>SELECT</code> with a <code>GROUP BY</code> aggregates data according to the <code>GROUP BY</code> clause and produces aggregate calculation against every calculation not in the <code>GROUP BY</code>.  In Malloy, this kind of command is called a `reduce`.

The second type of <code>SELECT</code> in SQL does not perform any aggregation; In Malloy, this command is called `project`.

When using `reduce`, Malloy knows which fields to group by and which to use as aggregate calculations.

In the query below, the data will be grouped by `state` and will produce an aggregate calculation for `airport_count`.
```malloy
--! {"isRunnable": true, "runMode": "auto", "isPaginationEnabled": true}
query: table('malloy-data.faa.airports')->{
  group_by: state
  aggregate: airport_count is count(*)
}
```

Multiple aggregations can be computed within the same `reduce` command.

```malloy
--! {"isRunnable": true, "runMode": "auto", "isPaginationEnabled": true}
query: table('malloy-data.faa.airports')->{
  group_by: fac_type
  aggregate: airport_count is count()
  aggregate: max_elevation is max(elevation)
}
```

Groups and aggregates can contain lists of fields

```malloy
--! {"isRunnable": true, "runMode": "auto", "isPaginationEnabled": true}
query: table('malloy-data.faa.airports')->{
  group_by: [state, county]
  aggregate: [
    airport_count is count()
    max_elevation is max(elevation)
  ]
}
```

## Everything has a Name

In Malloy, all output fields have names. This means that any time a query includes a
calculation or agregation, it must be aliased.

```malloy
--! {"isRunnable": true, "runMode": "auto", "isPaginationEnabled": true}
query: table('malloy-data.faa.airports')->{
  aggregate: max_elevation is max(elevation)
}
```

Malloy uses `name is value` instead of SQL's `value as name`, so the object being named comes first. Having the output column name written first makes reading code and imagining the structure of the output table easier.

Columns from a table and fields defined in an explore already have names, and can be referenced directly.

```malloy
--! {"isRunnable": true, "runMode": "auto", "isPaginationEnabled": true}
query: table('malloy-data.faa.airports')->{
  project: [
    full_name
    elevation
  ]
}
```

## Expressions

Many SQL expressions will work unchanged in Malloy, and many functions available in Standard SQL are usable in Malloy as well. This makes expressions fairly straightforward to understand given a knowledge of SQL.

```malloy
--! {"isRunnable": true, "runMode": "auto", "isPaginationEnabled": true, "size": "large"}
query: table('malloy-data.faa.airports')->{
  group_by: county_and_state is concat(county, ', ', state)
  aggregate: [
    airport_count is count()
    max_elevation is max(elevation)
    min_elevation is min(elevation)
    avg_elevation is avg(elevation)
  ]
}
```

The basic types of Malloy expressions are `string`, `number`, `boolean`, `date`, and `timestamp`.

## Modeling and Reuse

One of the main benefits of Malloy is the ability to save common calculations into a data model.  In the example below, we create an *explore* object named `airports` and
add calculations for `county_and_state` and `airport_count`.

```malloy
--! {"isModel": true, "modelPath": "/inline/airports_mini.malloy"}
explore: airports is table('malloy-data.faa.airports'){
  dimension: county_and_state is concat(county, ', ', state)
  measure: airport_count is count()
  measure: average_elevation is avg(elevation)
}
```

```malloy
--! {"isRunnable": true, "runMode": "auto", "isPaginationEnabled": true, "source": "/inline/airports_mini.malloy"}
query: airports->{
  group_by:county_and_state
  aggregate: airport_count
}
```

## Ordering and Limiting

In Malloy, ordering and limiting work pretty much the same way they do in SQL, though Malloy introduces some [reasonable defaults](order_by.md).

The `top` statement limits the number of rows returned, sorted by default by the first measure decending—in this case, `airport_count`.

```malloy
--! {"isRunnable": true, "runMode": "auto", "isPaginationEnabled": true}
query: table('malloy-data.faa.airports')->{
  top: 2
  group_by: state
  aggregate: airport_count is count(*)
}
```

Default ordering can be overridden with `order by`, as in the following query, which shows the states in alphabetical order.

```malloy
--! {"isRunnable": true, "runMode": "auto", "isPaginationEnabled": true}
query: table('malloy-data.faa.airports')->{
  order_by: state
  group_by: state
  aggregate: airport_count is count(*)
}
```

## Filtering

When working with data, filtering is something you do in almost every query. Malloy's filtering is more powerful and expressive than that of SQL. When querying data, we first isolate the data we are interested in (filter it) and then perform aggregations and calculations on the data we've isolated (shape it). Malloy provides consistent syntax for filtering everywhere within a query.

### Filtering Tables

A filter on a table narrows down which data is included from that table. This translates
to a <code>WHERE</code> clause in SQL.
In this case, the data from the table is filtered to just airports in California.

```malloy
--! {"isRunnable": true, "runMode": "auto", "isPaginationEnabled": true}
query: table('malloy-data.faa.airports'){where: state = 'CA'}->{
  top: 2
  group_by: county
  aggregate: airport_count is count()
}
```

### Filtering Measures

A filter on an aggregate calculation (a _measure_) narrows down the data used in that specific calculation. In the example below, the calculations for `airports` and `heliports` are filtered separately.

```malloy
--! {"isRunnable": true, "runMode": "auto", "isPaginationEnabled": true}
query: table('malloy-data.faa.airports')->{
  group_by: state
  aggregate: [
    airports is count() {where: fac_type = 'AIRPORT'}
    heliports is count() {? fac_type = 'HELIPORT'} -- ? is shorthad for 'where:'
    total is count()
  ]
}
```

### Filtering in Query Stages

Filters can also be applied to `reduce` and `project` commands. When using a filter in this way, it only applies to
the data for that command alone. This will become more important later when we have more than one `reduce` in a query.

```malloy
--! {"isRunnable": true, "runMode": "auto", "isPaginationEnabled": true}
query: table('malloy-data.faa.airports')-> {
  where: state: 'AL' | 'KY'
  top: 5
  group_by: state
  aggregate: [
    airports  is count() {? fac_type: 'AIRPORT'}
    heliports is count() {? fac_type: 'HELIPORT'}
    total     is count()
  ]
}
```

## Dates and Timestamps

Working with time in data is often needlessly complex; Malloy has built in constructs to simplify many time-related operations. This section gives a brief introduction to some of these tools, but for more details see the [Time Ranges](time-ranges.md) section.

### Time Literals

Literals of type `date` and `timestamp` are notated with an `@`, e.g. `@2003-03-29` or `@1994-07-14 10:23:59`. Similarly, years (`@2021`), quarters (`@2020-Q1`), months (`@2019-03`), weeks (`@WK2021-08-01`), and minutes (`@2017-01-01 10:53`) can be expressed.

Time literals can be used as values, but are more often useful in filters. For example, the following query
shows the number of flights in 2003.

```malloy
--! {"isRunnable": true, "runMode": "auto"}
query: table('malloy-data.faa.flights') {? dep_time: @2003}->{
  aggregate: flight_count is count()
}
```

There is a special time literal `now`, referring to the current timestamp, which allows for relative time filters.

```malloy
query: table('malloy-data.faa.flights'){? dep_time > now - 6 hours}->{
  aggregate: flights_last_6_hours is count()
}
```

### Truncation

Time values can be truncated to a given timeframe, which can be `second`, `minute`, `hour`, `day`, `week`, `month`, `quarter`, or `year`.

```malloy
--! {"isRunnable": true, "runMode": "auto"}
query: table('malloy-data.faa.flights')->{
  group_by: [
    flight_year is dep_time.year
    flight_month is dep_time.month
  ]
  aggregate: flight_count is count()
}
```

### Extraction

Numeric values can be extracted from time values, e.g. `day_of_year(some_date)` or `minute(some_time)`. See the full list of extraction functions [here](time-ranges.md#extraction).

```malloy
--! {"isRunnable": true, "runMode": "auto", "pageSize": 7, "size": "large"}
query: table('malloy-data.faa.flights') ->{
  order_by: 1
  group_by: day_of_week is day(dep_time)
  aggregate: flight_count is count()
}
```

<!-- TODO it may be worth having a doc describing what the JSON+Metadata
output of these look like, i.e. that the JSON just includes a regular date,
but the metadata specifices that it's in that given timeframe.
And likewise for any other data type that has interesting output metadata. -->

### Time Ranges

Two kinds of time ranges are given special syntax: the range between two times and the range starting at some time for some duration. These are represented like `@2003 to @2005` and `@2004-Q1 for 6 quarters` respectively. These ranges can be used in filters just like time literals.

```malloy
--! {"isRunnable": true, "runMode": "auto"}
query: table('malloy-data.faa.flights'){? dep_time: @2003 to @2005}->{
  aggregate:flight_count is count()
}
```

Time literals and truncations can also behave like time ranges. Each kind of time literal has an implied duration that takes effect when it is used in a comparison, e.g. `@2003` represents the whole of the year 2003, and `@2004-Q1` lasts the whole 3 months of the quarter. Similarly, when a time value is truncated, it takes on the
timeframe from the truncation, e.g. `now.month` means the entirety of the current month.

When a time range is used in a comparison, `=` checks for "is in the range", `>` "is after", and `<` "is before." So `some_time > @2003` filters dates starting on January 1, 2004, while `some_time = @2003` filters to dates in the year 2003.

```malloy
--! {"isRunnable": true, "runMode": "auto"}
query: table('malloy-data.faa.flights'){? dep_time > @2003}->{
  top: 3; order_by: 1 asc
  group_by:departure_date is dep_time.day
  aggregate: flight_count is count()
}
```

## Nested Queries

The next several examples will use this simple explore definition:

```malloy
explore: airports is table('malloy-data.faa.airports'){
  airport_count is count()
};
```

### Aggregating Subqueries

In Malloy, queries can be [nested](nesting.md) to produce subtables on each output row. Such nested queries are called _aggregating subqueries_, or simply "nested queries." When a query is nested inside another query, each output row of the outer query will have a nested table for the inner query which only includes data limited to that row.

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "faa/airports.malloy"}

query: airports->{
  group_by: state
  aggregate: airport_count
  nest: by_facility is {
    group_by: fac_type
    aggregate: airport_count
  }
}
```

Here we can see that the `by_facility` column of the output table contains nested subtables on each row. When interpreting these inner tables, all of the dimensional values from outer rows still apply to each of the inner rows.

Queries can be nested infinitely, allowing for rich, complex output structures. A query may always include another nested query, regardless of depth.

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "faa/airports.malloy", "size": "large"}
query: airports->{
  group_by: state
  aggregate: airport_count
  nest: top_5_counties is {
    top: 5
    group_by: county
    aggregate: airport_count
    nest: by_facility is {
      group_by: fac_type
      aggregate: airport_count
    }
  }
}
```

### Filtering Nested Queries

Filters can be isolated to any level of nesting. In the following example, we limit the `major_facilities` query to only airports where `major` is `'Y'`. This particular filter applies _only_ to `major_facilities`, and not to other parts of the outer query.

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "faa/airports.malloy", "size": "large"}
query: airports->{
  where: state = 'CA'
  group_by: county
  aggregate: airport_count
  nest: major_facilities is {
    where: major = 'Y'
    group_by: name is concat(code, ' (', full_name, ')')
  }
  nest: by_facility is {
    group_by: fac_type
    aggregate: airport_count
  }
}
```

## Piping and Multi-stage Queries

The output from one stage of a query can be "piped" into another stage using `|`. For example, we'll start with this query which outputs, for California and New York, the total number of airports, as well as the number of airports in each county.

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "faa/airports.malloy", "size": "small"}
query: airports->{
  where: state = 'CA' | 'NY'
  group_by: state
  aggregate: airport_count
  nest: by_county is {
    group_by: county
    aggregate: airport_count
  }
}
```

Next, we'll use the output of that query as the input to another, where we determine which counties have the highest
percentage of airports compared to the whole state, taking advantage of the nested structure of the data to to so.

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "faa/airports.malloy", "size": "large", "dataStyles": { "percent_in_county": { "renderer": "percent" }}}
query: airports->{
  where: state = 'CA' | 'NY'
  group_by: state
  aggregate: airport_count
  nest: by_county is {
    group_by: county
    aggregate: airport_count
  }
}
-> {
  top: 10; order_by: 4 desc
  project: [
    by_county.county
    airports_in_county is by_county.airport_count
    airports_in_state is airport_count
    percent_in_county is by_county.airport_count / airport_count
  ]
}
```

## Joins

Joins are declared as part of an explore, and link primary and foreign keys.

```malloy
--! {"isRunnable": true, "runMode": "auto", "isPaginationEnabled": true}
explore: airports is table('malloy-data.faa.airports'){
  primary_key: code
}

explore: flights is table('malloy-data.faa.flights'){
  measure: flight_count is count()
  join: origin_airport is airports on origin
}

query: flights->{
  group_by: origin_state is origin_airport.state
  aggregate: flight_count
}
```

In this example, the `airports` explore is joined to `flights`, linking the foreign key `origin` of `flights` to the primary key `code` of `airports`. The resulting joined explore is aliased as `origin_airport` within `flights`.

## Aggregate Calculations

As in SQL, aggregate functions `sum`, `count`, and `avg` are available, and their use in
an expression identifies the corresponding field as a [measure](fields.md#measures).

Aggregates may be computed with respect to any joined explore, allowing for a wider variety of measurements to be calculated than is possible in SQL. See the [Aggregate Locality](aggregates.md#aggregate-locality) section for more information.

```malloy
--! {"isRunnable": true, "runMode": "auto", "source": "faa/flights.malloy"}
query: aircraft-> {
  aggregate: [
    -- The average number of seats on models of registered aircraft
    models_avg_seats is aircraft_models.seats.avg()
    -- The average number of seats on registered aircraft
    aircraft_avg_seats is avg(aircraft_models.seats)
  ]
}
```

## Comments

Malloy code can include both line and block comments. Line comments, which begin with `--` or `//`,
may appear anywhere within a line, and cause all subsequent characters on that line to be ignored.
Block comments, which are enclosed between <code>/\*</code> and <code>\*/</code>, cause all enclosed characters to be ignored
and may span multiple lines.

```malloy
-- The total number of flight entries
query: flights-> {
  aggregate: flight_count // Defined simply as `count()`
}

/*
 * A comparison of the total number of flights
 * for each of the tracked carriers.
 */
query: flights-> {
  group_by: carrier
  aggregate: flight_count
  /* total_distance */
}
```




<!-- ## Joins are between primary and foriegn keys.


## Full graph of the data is available to query

## Sums and Counts and average are a little different.

## Calculations can correctly occur anywhere in the graph -->



<!--

## Removed things
- Commas are optional.
- Count can be written without the `*`.

-->
