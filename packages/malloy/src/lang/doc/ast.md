# The Malloy "AST"

The ANTLR parse tree is transformed into an AST. This AST
will eventually be transformed into the plain javascript
objects which can be thought of as the "compiled" version
of malloy text.

# Structure of the AST

An AST node looks like the grammar for the object
it is representing, with the parts from the grammer available
as actual properties on the node object. For example an explore
definition looks like ...

```
explore
  : EXPLORE? exploreSource filterList?
      primaryKey? fieldListEdit? (FIELDS? fieldDefList)? joinList?
      pipeline
  ;
```

and the AST object is

```
export class Explore implements Element, ExploreInterface {
  elementType = "explore";

  // ExploreInterface
  primaryKey?: PrimaryKey;
  fieldListEdit?: FieldListEdit;
  fields: FieldDefinition[] = [];
  joins?: Join[];
  filters: Filter[] = [];
  pipeline: Pipestage[] = [];
```


## Methods on an AST object

In general, the convention is, if an AST object knows how to make
a `model/` object from itself with no further information, then
it will have a function with the name of that type. So if an
explore knows how to make a `Query` then it will have a
function `query(): Query`

If more information is needed (most common pieces of information
are a `Realm` or a `FieldSpace`) then the function for returning
a piece of model/ typed data will be prefixed with `get` as in
`getQuery(realm: Realm): Query`

Some objects can return more than one type, and that is fine. The
caller is expected to know the type of the particular AST element
well enough to know exactly which methods it implements.

## Expression Trees

All AST elements which participate in arithmetic expressions are
subclasses of `ExpressionDef`. They have a `translation` method, which is
expected to return an `ExprValue` which is a type and a tree of value
`Fragment`s generated by walking the expression tree.

The abstract class `ExpressionDef` implements `getFieldDef`,
which will assemble those fragments into a `FieldDef`.

### Fragments

When generating data structures for the query writer, an expression is
translated into a `Fragment` tree. Nodes in a `Fragment` tree are strings
which are already SQL, or a simple object with a `type: string` header
which represents a subtree of one kind or another. The query writer will do
final expansion of any tree nodes into a string.

The `tranlsation` method is expected to type check any sub expressions
that this expression references. Any node in an expression tree which
wants to result in SQL will need to have this method.

The `apply` method which a few nodes implement is the key to the value chaining
and partial comparison operators. Only nodes which interact with partial
or chained evaluation need to implement this.

## Realm

Do no quite have this factored right, but the "Realm" contains three pieces
of data which many (but not all) AST nodes need to do translation.

* The schema for any referenced tables, to resolve table reference4s
* The model, to resolve explore name references
* A log method for reporting semantic errors during translation

## Field Space

A `FieldSpace` is a symbol table roughly equivalent to a `StructDef`. You
can ask a `FieldSpace` to look up a dotted path name, and you can
ask a `FieldSpace` for its  `StructDef`

A `SpaceField` is the set of wrapper classes for `FieldDef` objects
and is what you will get back if you ask a `FieldSpace` to lookup a field.

AST elements, in translation, need a field space, but because some field
spaces are constructed during translation, this is always passed as
an argument and is never stored.
