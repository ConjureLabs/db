CREATE TYPE rating AS ENUM('awesome', 'good', 'okay', 'bad', 'terrible');

CREATE TABLE account_rating (
  id SERIAL PRIMARY KEY,
  account_id INT REFERENCES account (id) NOT NULL,
  movie_id INT REFERENCES movie (id) NOT NULL,
  rating rating NOT NULL,
  review TEXT,
  added TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE (account_id, movie_id)
);
