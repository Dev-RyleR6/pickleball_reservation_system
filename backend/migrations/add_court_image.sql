-- Add image column to courts table
-- Run this SQL in your database

ALTER TABLE `courts` 
ADD COLUMN `image` VARCHAR(255) DEFAULT NULL AFTER `location`;

-- If the column already exists, you can skip this or use:
-- ALTER TABLE `courts` MODIFY COLUMN `image` VARCHAR(255) DEFAULT NULL;
