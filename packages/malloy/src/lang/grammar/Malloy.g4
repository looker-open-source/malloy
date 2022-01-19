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
grammar Malloy;

malloyDocument: (malloyStatement | SEMI)* EOF;

malloyStatement
  : defineExploreStatement
  | defineQuery
  | importStatement
  ;

defineExploreStatement
  : EXPLORE exploreDefinitionList
  ;

defineQuery
  : QUERY topLevelQueryDefs  # namedQueries_stub
  | QUERY query              # anonymousQuery
  ;

importStatement
  : IMPORT importURL
  ;

importURL
  : JSON_STRING
  ;

topLevelQueryDefs
  : topLevelQueryDef
  | OBRACK (topLevelQueryDef COMMA?)* CBRACK
  ;

topLevelQueryDef
  : queryName IS query
  ;

query
  : explore ARROW pipelineFromName                  # exploreArrowQuery
  | ARROW queryName queryProperties? pipeElement*   # arrowQuery
  ;

pipelineFromName
  : firstSegment pipeElement*
  ;

firstSegment
  : queryProperties
  | exploreQueryName queryProperties?
  ;

pipeElement
  : ARROW queryProperties
  ;

exploreTable
  : TABLE OPAREN tableName CPAREN
  ;

queryProperties
  : filterShortcut
  | OCURLY (queryStatement | SEMI)* CCURLY
  ;

filterShortcut
  : OCURLY QMARK fieldExpr CCURLY
  ;

exploreQueryName : id;
queryName : id;

exploreDefinitionList
  : OBRACK (exploreDefinition COMMA?)* CBRACK   # defineManyExplores
  | exploreDefinition                           # defineOneExplore
  ;

exploreDefinition
  : exploreNameDef IS explore
  ;

explore
  : exploreSource exploreProperties?
  ;

exploreSource
  : exploreName                                   # NamedSource
  | exploreTable                                  # TableSource
  | FROM OPAREN query CPAREN                      # QuerySource
  ;

exploreNameDef: id;
exploreName: id;

exploreProperties
  : OCURLY (exploreStatement | SEMI)* CCURLY
  | filterShortcut
  ;

exploreStatement
  : DIMENSION dimensionDefList         # defExploreDimension
  | MEASURE measureDefList             # defExploreMeasure
  | JOIN joinList                      # defExploreJoin
  | whereStatement                     # defExploreWhere
  | PRIMARY_KEY fieldName              # defExplorePrimaryKey
  | RENAME fieldName IS fieldName      # defExploreRename
  | (ACCEPT | EXCEPT) fieldNameList    # defExploreEditField
  | QUERY subQueryDefList              # defExploreQuery
  ;

dimensionDefList
  : OBRACK (dimensionDef COMMA?)* CBRACK
  | dimensionDef
  ;

measureDefList
  : OBRACK (measureDef COMMA?)* CBRACK
  | measureDef
  ;

fieldDef
  : fieldNameDef IS fieldExpr
  ;

fieldNameDef: id;
joinNameDef: id;

measureDef: fieldDef;

joinList
  : OBRACK (joinDef COMMA?)* CBRACK
  | joinDef
  ;

joinDef
  : joinNameDef IS explore ON fieldPath
  | joinNameDef ON fieldPath
  ;

filterStatement
  : whereStatement
  | havingStatement
  ;

filteredBy
  : QMARK fieldExpr                   # filterByShortcut
  | whereStatement                    # filterByWhere
  ;

filterClauseList
  : fieldExpr
  | OBRACK fieldExprList CBRACK
  ;

whereStatement
  : WHERE filterClauseList
  ;

havingStatement
  : HAVING filterClauseList
  ;

subQueryDefList
  : OBRACK (exploreQueryDef COMMA?)* CBRACK
  | exploreQueryDef
  ;

exploreQueryNameDef: id;

exploreQueryDef
  : exploreQueryNameDef IS pipelineFromName
  ;

groupByStatement
  : GROUP_BY groupByList
  ;

groupByList
  : OBRACK (groupByEntry COMMA?)* CBRACK
  | groupByEntry
  ;

dimensionDef: fieldDef;

groupByEntry
  : fieldPath
  | dimensionDef
  ;

queryStatement
  : groupByStatement
  | projectStatement
  | indexStatement
  | aggregateStatement
  | topStatement
  | limitStatement
  | orderByStatement
  | whereStatement
  | havingStatement
  | nestStatement
  ;

nestStatement
  : NEST nestedQueryList
  ;

nestedQueryList
  : nestEntry
  | OBRACK (nestEntry COMMA?)* CBRACK
  ;

nestEntry
  : queryName                       # nestExisting
  | queryName IS pipelineFromName   # nestDef
  ;

aggregateStatement
  : AGGREGATE aggregateList
  ;

aggregateEntry
  : fieldPath
  | measureDef
  ;

aggregateList
  : OBRACK (aggregateEntry COMMA?)* CBRACK
  | aggregateEntry
  ;

projectStatement
  : PROJECT fieldCollection
  ;

orderByStatement
  : ORDER_BY ordering
  ;

ordering
  : orderBySpec
  | OBRACK orderBySpec (COMMA orderBySpec)* COMMA? CBRACK
  ;

orderBySpec
  : (INTEGER_LITERAL | fieldName) ( ASC | DESC ) ?
  ;

limitStatement
  : LIMIT INTEGER_LITERAL
  ;

bySpec
  : BY fieldName
  | BY fieldExpr
  ;

topStatement
  : TOP INTEGER_LITERAL bySpec?
  ;

indexStatement
  : INDEX fieldNameList (BY fieldName)?
  ;

aggregate: SUM | COUNT | AVG | MIN | MAX;
malloyType: STRING | NUMBER | BOOLEAN | DATE | TIMESTAMP;
compareOp: MATCH | NOT_MATCH | GT | LT | GTE | LTE | EQ | NE;

literal
  : STRING_LITERAL                              # exprString
  | (NUMERIC_LITERAL | INTEGER_LITERAL)         # exprNumber
  | dateLiteral                                 # exprTime
  | NULL                                        # exprNULL
  | (TRUE | FALSE)                              # exprBool
  | HACKY_REGEX                                 # exprRegex
  | NOW                                         # exprNow
  ;

dateLiteral
  : LITERAL_TIMESTAMP      # literalTimestamp
  | LITERAL_DAY            # literalDay
  | LITERAL_WEEK           # literalWeek
  | LITERAL_MONTH          # literalMonth
  | LITERAL_QUARTER        # literalQuarter
  | LITERAL_YEAR           # literalYear
  ;

tableName
  : STRING_LITERAL;

id
  : IDENTIFIER
  | OBJECT_NAME_LITERAL
  ;

timeframe
  : SECOND | MINUTE | HOUR | DAY | WEEK | MONTH | QUARTER | YEAR
  ;

fieldExpr
  : fieldPath                                              # exprFieldPath
  | fieldExpr OCURLY filteredBy CCURLY                     # exprFilter
  | literal                                                # exprLiteral
  | MINUS fieldExpr                                        # exprMinus
  | fieldExpr timeframe                                    # exprDuration
  | fieldExpr DOT timeframe                                # exprTimeTrunc
  | fieldExpr DOUBLECOLON malloyType                       # exprSafeCast
  | fieldExpr ( STAR | SLASH ) fieldExpr                   # exprMulDiv
  | fieldExpr ( PLUS | MINUS ) fieldExpr                   # exprAddSub
  | fieldExpr TO fieldExpr                                 # exprRange
  | startAt=fieldExpr FOR duration=fieldExpr timeframe     # exprForRange
  | fieldExpr (AMPER | BAR) partialAllowedFieldExpr        # exprLogicalTree
  | fieldExpr compareOp fieldExpr                          # exprCompare
  | fieldExpr COLON partialAllowedFieldExpr                # exprApply
  | NOT fieldExpr                                          # exprNot
  | fieldExpr (AND | OR) fieldExpr                         # exprLogical
  | CAST OPAREN fieldExpr AS malloyType CPAREN             # exprCast
  | COUNT OPAREN DISTINCT fieldExpr CPAREN                 # exprCountDisinct
  | (fieldPath DOT)?
      aggregate
      OPAREN (fieldExpr | STAR)? CPAREN                    # exprAggregate
  | OPAREN partialAllowedFieldExpr CPAREN                  # exprExpr
  | (id | timeframe) OPAREN ( fieldExprList? ) CPAREN      # exprFunc
  | pickStatement                                          # exprPick
  ;

partialAllowedFieldExpr
  : compareOp fieldExpr                                    # exprPartialCompare
  | fieldExpr                                              # exprNotPartial
  ;

pickStatement
  : pick+ (ELSE pickElse=fieldExpr)?
  ;

pick
  : PICK (pickValue=fieldExpr)? WHEN pickWhen=partialAllowedFieldExpr
  ;

fieldExprList
  : fieldExpr (COMMA fieldExpr)* COMMA?
  ;

fieldNameList
  : fieldOrStar
  | OBRACK fieldOrStar ( COMMA fieldOrStar)* COMMA? CBRACK
  ;

fieldOrStar
  : STAR
  | fieldName
  ;

fieldCollection
  : collectionMember
  | OBRACK (collectionMember COMMA?)* COMMA? CBRACK
  ;

collectionMember
  : fieldPath                         # nameMember
  | (fieldPath DOT)? (STAR|STARSTAR)  # wildMember
  | fieldDef                          # newMember
  ;

// Possibly wasted work adding semantics to "id" references
fieldPath
  : fieldName
  | joinPath DOT joinField
  ;

joinPath
  : joinName (DOT joinName)*
  ;

joinField: id;
joinName: id;
fieldName: id;

justExpr: fieldExpr EOF;

json
  : jsonValue
  ;

jsonValue
   : JSON_STRING
   | INTEGER_LITERAL
   | NUMERIC_LITERAL
   | jsonObject
   | jsonArray
   | TRUE
   | FALSE
   | NULL
   ;

jsonObject
   : OCURLY jsonProperty (COMMA jsonProperty)* CCURLY
   | OCURLY CCURLY
   ;

jsonProperty
   : JSON_STRING COLON jsonValue
   ;

jsonArray
   : OBRACK jsonValue (COMMA jsonValue)* CBRACK
   | OBRACK CBRACK
   ;

JSON_STRING: '"' (ESC | SAFECODEPOINT)* '"';

fragment ESC: '\\' (["\\/bfnrt] | UNICODE);
fragment UNICODE: 'u' HEX HEX HEX HEX;
fragment HEX: [0-9a-fA-F];
fragment SAFECODEPOINT: ~ ["\\\u0000-\u001F];
fragment SPACE_CHAR: [ \u000B\t\r\n];

// colon keywords ...
ACCEPT: A C C E P T SPACE_CHAR* ':';
AGGREGATE: A G G R E G A T E SPACE_CHAR* ':';
DIMENSION: D I M E N S I O N SPACE_CHAR* ':';
EXCEPT: E X C E P T SPACE_CHAR* ':';
EXPLORE: E X P L O R E SPACE_CHAR* ':';
GROUP_BY: G R O U P '_' B Y SPACE_CHAR* ':';
HAVING: H A V I N G SPACE_CHAR* ':';
INDEX: I N D E X SPACE_CHAR* ':';
JOIN: J O I N SPACE_CHAR* ':';
LIMIT: L I M I T SPACE_CHAR* ':';
MEASURE: M E A S U R E SPACE_CHAR* ':';
NEST: N E S T SPACE_CHAR* ':';
ORDER_BY: O R D E R '_' B Y SPACE_CHAR* ':';
PRIMARY_KEY: P R I M A R Y '_' K E Y SPACE_CHAR* ':';
PROJECT: P R O J E C T SPACE_CHAR* ':';
QUERY: Q U E R Y SPACE_CHAR* ':';
RENAME: R E N A M E SPACE_CHAR* ':';
TOP: T O P SPACE_CHAR* ':';
WHERE: W H E R E SPACE_CHAR* ':';

// bare keywords
AND: A N D ;
AS: A S ;
ASC: A S C ;
AVG: A V G ;
BOOLEAN: B O O L E A N;
BY: B Y ;
CASE: C A S E ;
CAST: C A S T ;
CONDITION: C O N D I T I O N ;
COUNT: C O U N T ;
CROSS: C R O S S ;
DATE: D A T E;
DAY: D A Y S?;
DESC: D E S C ;
DISTINCT: D I S T I N C T ;
ELSE: E L S E ;
END: E N D ;
FALSE: F A L S E;
FOR: F O R;
FROM: F R O M ;
HAS: H A S ;
HOUR: H O U R S?;
IMPORT: I M P O R T;
IS: I S ;
JSON: J S O N;
LAST: L A S T ;
MAX: M A X;
MIN: M I N;
MINUTE: M I N U T E S?;
MONTH: M O N T H S?;
NOT: N O T ;
NOW: N O W;
NULL: N U L L ;
NUMBER: N U M B E R;
ON: O N ;
OR: O R ;
PICK: P I C K ;
QMARK: '?';
QUARTER: Q U A R T E R S?;
SECOND: S E C O N D S?;
STRING: S T R I N G;
SUM: S U M ;
TABLE: T A B L E;
THEN: T H E N ;
THIS: T H I S;
TIMESTAMP: T I M E S T A M P;
TO: T O;
TRUE: T R U E ;
TURTLE: T U R T L E;
WEEK: W E E K S?;
WHEN: W H E N ;
YEAR: Y E A R S?;

STRING_ESCAPE
  : '\\' '\''
  | '\\' '\\'
  | '\\' .;
HACKY_REGEX: ('/' | [rR]) '\'' (STRING_ESCAPE | ~('\\' | '\''))* '\'';
STRING_LITERAL: '\'' (STRING_ESCAPE | ~('\\' | '\''))* '\'';

AMPER: '&';
ARROW: '->';
FAT_ARROW: '=>';
OPAREN: '(' ;
CPAREN: ')' ;
OBRACK: '[' ;
CBRACK: ']' ;
OCURLY: '{' ;
CCURLY: '}' ;
DOUBLECOLON: '::';
COLON: ':' ;
COMMA: ',';
DOT: '.' ;
LT: '<' ;
GT: '>' ;
EQ: '=' ;
NE: '!=' ;
LTE: '<=' ;
GTE: '>=' ;
PLUS: '+' ;
MINUS: '-' ;
STAR: '*' ;
STARSTAR: '**';
SLASH: '/' ;
BAR: '|' ;
SEMI: ';' ;
NOT_MATCH: '!~' ;
MATCH: '~' ;

fragment F_YEAR: DIGIT DIGIT DIGIT DIGIT;
fragment F_DD: DIGIT DIGIT;
fragment LX: '-' 'X' (ID_CHAR | DIGIT)+;
LITERAL_TIMESTAMP
  : '@' F_YEAR '-' F_DD '-' F_DD
    ' ' F_DD ':' F_DD ( ':' F_DD )? LX?
  ;
LITERAL_DAY:     '@' F_YEAR '-' F_DD '-' F_DD LX?;
LITERAL_QUARTER: '@' F_YEAR '-' 'Q' ('1'|'2'|'3'|'4') LX?;
LITERAL_MONTH:   '@' F_YEAR '-' F_DD LX?;
LITERAL_WEEK:    '@' W K F_YEAR '-' F_DD '-' F_DD LX?;
LITERAL_YEAR:    '@' F_YEAR LX?;

IDENTIFIER: ID_CHAR ( ID_CHAR | DIGIT )*;

INTEGER_LITERAL: DIGIT+ ;

NUMERIC_LITERAL
  : DIGIT+ ( DOT DIGIT* ) ?
  | DOT DIGIT+ (E [-+]? DIGIT+)?
  ;

OBJECT_NAME_LITERAL: '`' ID_CHAR ( ID_CHAR | DIGIT )* '`';

fragment ID_CHAR: [\p{Alphabetic}_] ;
fragment DIGIT: [0-9];
fragment A: [aA] ; fragment B: [bB] ; fragment C: [cC] ; fragment D: [dD] ;
fragment E: [eE] ; fragment F: [fF] ; fragment G: [gG] ; fragment H: [hH] ;
fragment I: [iI] ; fragment J: [jJ] ; fragment K: [kK] ; fragment L: [lL] ;
fragment M: [mM] ; fragment N: [nN] ; fragment O: [oO] ; fragment P: [pP] ;
fragment Q: [qQ] ; fragment R: [rR] ; fragment S: [sS] ; fragment T: [tT] ;
fragment U: [uU] ; fragment V: [vV] ; fragment W: [wW] ; fragment X: [xX] ;
fragment Y: [yY] ; fragment Z: [zZ] ;

BLOCK_COMMENT: '/*' .*? '*/' -> channel(HIDDEN);
COMMENT_TO_EOL: ('--' | '//') ~[\r\n]* (('\r'? '\n') | EOF) -> channel(HIDDEN) ;
WHITE_SPACE: SPACE_CHAR -> skip ;

// Matching any of these is a parse error
UNWATED_CHARS_TRAILING_NUMBERS: DIGIT+ ID_CHAR+ (ID_CHAR | DIGIT)*;
UNEXPECTED_CHAR: .;
