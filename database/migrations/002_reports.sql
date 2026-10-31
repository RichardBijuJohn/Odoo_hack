-- Report snapshots preserve the rows shown in preview and optional export files.
CREATE TABLE IF NOT EXISTS report_runs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_name VARCHAR(150) NOT NULL,
  report_type ENUM('summary', 'detailed', 'daily', 'weekly', 'monthly', 'custom') NOT NULL,
  entity VARCHAR(32) NOT NULL,
  generated_by INT NULL,
  filters_json LONGTEXT NOT NULL,
  summary_json LONGTEXT NOT NULL,
  data_json LONGTEXT NOT NULL,
  record_count INT UNSIGNED NOT NULL DEFAULT 0,
  export_format ENUM('preview', 'csv', 'xlsx', 'pdf') NOT NULL DEFAULT 'preview',
  file_name VARCHAR(180) NULL,
  file_type VARCHAR(120) NULL,
  file_data LONGBLOB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_report_runs_created_at (created_at),
  INDEX idx_report_runs_type (report_type),
  CONSTRAINT fk_report_runs_generated_by
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
);