/*
  # Initial Database Setup
  
  1. Extensions
    - Enable UUID extension for primary keys
    - Enable any other required extensions
  
  2. Configuration
    - Set up any global database settings
*/

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable any other required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; 