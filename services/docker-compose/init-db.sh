#!/bin/bash
set -e

for db in identity_db catalog_db booking_db payments_db reviews_db; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    CREATE DATABASE $db;
EOSQL
done
