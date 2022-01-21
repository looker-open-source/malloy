# Final Model

Final Data Model - Goto [Solve Puzzles](wordle5.md)

```malloy
--! {"isModel": true, "modelPath": "/inline/w1.malloy"}

-- Make a table of 5 letter words
explore: words is table('malloy-data.malloytest.words'){
  query: five_letter_words is {
    where: length(word) = 5 and  word ~ r'^[a-z]....$'
    project: word is UPPER(word)
  }
}

-- Cross join numbers
explore: numbers is table('malloy-data.malloytest.numbers'){
  where: num <= 5

  -- code to fake a cross join
  primary_key: a -- key to fake a cross join
  dimension: a is 'a';
}

-- Build a new table of word and each letter in position
explore: words_and_letters is from(words->five_letter_words){
  -- Cross join is missing at the moment
  join_one: numbers with a
  dimension: a is 'a' -- key to fake a cross join

  query: words_and_position is {
    group_by: word
    nest: letters is {
      order_by: 2
      group_by: [
        letter is substr(word, numbers.num, 1)
        position is numbers.num

      ]
    }
  }
}

-- build a word finder that can generate a score best available guess.
explore: wordle is from(words_and_letters->words_and_position){
  where: word !~ r'(S|ED)$'
  measure: word_count is count()

  query: find_words is {
    group_by: [
      letters.letter
      letters.position
    ]
    aggregate: word_count
    nest: words_list is {
      group_by: word
    }
  }->{
    group_by: words_list.word
    aggregate: score is word_count.sum()
  }
}
```