CREATE TABLE director (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  film_count INT NOT NULL,
  added TIMESTAMP WITH TIME ZONE NOT NULL
);
