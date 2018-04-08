CREATE TYPE rating AS ENUM('awesome', 'good', 'okay', 'bad', 'terrible');

CREATE TABLE user_rating (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES user (id) NOT NULL,
  movie_id INT REFERENCES movie (id) NOT NULL,
  rating rating NOT NULL,
  review TEXT,
  added TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE (user_id, movie_id)
);
