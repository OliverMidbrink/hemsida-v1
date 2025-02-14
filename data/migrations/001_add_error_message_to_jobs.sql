-- Migration: Add error_message column to the jobs table

ALTER TABLE jobs ADD COLUMN error_message TEXT; 