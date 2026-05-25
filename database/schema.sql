-- El Sueño CSLT — MySQL schema for quote requests
-- Run once (e.g. in MySQL Workbench or: mysql -u root -p < database/schema.sql)

CREATE DATABASE IF NOT EXISTS elsueno_cslt
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE elsueno_cslt;

CREATE TABLE IF NOT EXISTS quotes (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL DEFAULT '',
  project_type VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'reviewed') NOT NULL DEFAULT 'new',
  created_at DATETIME(3) NOT NULL,
  INDEX idx_quotes_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
