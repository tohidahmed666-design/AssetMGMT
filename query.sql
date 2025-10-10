ALTER LOGIN sa ENABLE;
GO
ALTER LOGIN sa WITH PASSWORD = 'Die$eL006';
GO

EXIT

select * from Assets

use AssetDB


ALTER TABLE Assets
ADD CONSTRAINT UQ_AssetNumber UNIQUE (assetNumber);

ALTER TABLE Assets ADD CONSTRAINT DF_Assets_Status DEFAULT 'available' FOR status;

SELECT name
FROM sys.default_constraints
WHERE parent_object_id = OBJECT_ID('Assets')
  AND parent_column_id = (
      SELECT column_id 
      FROM sys.columns 
      WHERE object_id = OBJECT_ID('Assets') 
        AND name = 'status'
  );

  ALTER TABLE Assets DROP CONSTRAINT DF_Assets_Status;

  SELECT dc.name AS DefaultConstraintName, c.name AS ColumnName
FROM sys.default_constraints dc
JOIN sys.columns c 
  ON dc.parent_object_id = c.object_id
  AND dc.parent_column_id = c.column_id
WHERE OBJECT_NAME(dc.parent_object_id) = 'Assets'
  AND c.name = 'status';

  ALTER TABLE Assets DROP CONSTRAINT DF__Assets__status__4AB81AF0;

  ALTER TABLE Assets ADD CONSTRAINT DF_Assets_Status DEFAULT 'available' FOR status;

  ALTER TABLE Assets
ADD CONSTRAINT DF_Assets_Status DEFAULT 'available' FOR status;


ALTER TABLE Assets
DROP CONSTRAINT DF__Assets__status__4AB81AF0;

SELECT dc.name AS DefaultConstraintName, c.name AS ColumnName
FROM sys.default_constraints dc
JOIN sys.columns c 
  ON dc.parent_object_id = c.object_id
  AND dc.parent_column_id = c.column_id
WHERE OBJECT_NAME(dc.parent_object_id) = 'Assets'
  AND c.name = 'status';

  ALTER TABLE Assets
DROP CONSTRAINT DF_Assets_Status;


ALTER TABLE Assets
ADD CONSTRAINT DF_Assets_Status DEFAULT 'available' FOR status;

SELECT id, username, password FROM Users;

ALTER TABLE Users ADD name NVARCHAR(255) NULL;

UPDATE Users SET name = 'Unknown' WHERE name IS NULL;

ALTER TABLE Users ALTER COLUMN name NVARCHAR(255) NOT NULL;

ALTER TABLE Users ADD name NVARCHAR(255) NULL;
ALTER TABLE Users ADD email NVARCHAR(255) NULL;

EXEC sp_columns Users;

EXEC sp_rename 'Users.username', 'email', 'COLUMN';

SELECT COLUMN_NAME, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Users';

ALTER TABLE Users
ADD CONSTRAINT UQ_Users_Email UNIQUE (email);

ALTER TABLE [Users] ADD CONSTRAINT DF_Users_isVerified DEFAULT 0 FOR isVerified;

SELECT 
    dc.name AS DefaultConstraint,
    c.name AS ColumnName,
    OBJECT_NAME(dc.parent_object_id) AS TableName,
    dc.definition
FROM sys.default_constraints dc
JOIN sys.columns c 
    ON c.object_id = dc.parent_object_id 
    AND c.column_id = dc.parent_column_id
WHERE OBJECT_NAME(dc.parent_object_id) = 'Users';

SELECT * FROM Users;

SELECT lh.id, u.email, lh.loginTime, lh.logoutTime, lh.ipAddress
FROM LoginHistory lh
JOIN Users u ON u.id = lh.userId
ORDER BY lh.loginTime DESC;

SELECT * FROM Users
WHERE isLoggedIn = 1;

SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE';

SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'LoginHistories';

SELECT lh.id,
       u.email,
       lh.loginTime,
       lh.logoutTime,
       lh.ipAddress
FROM dbo.LoginHistories lh
JOIN dbo.Users u ON u.id = lh.userId
ORDER BY lh.loginTime DESC;

SELECT COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'LoginHistories';


SELECT lh.id,
       u.email AS userEmail,
       lh.ip AS ipAddress,
       lh.userAgent,
       lh.success,
       lh.loggedAt
FROM dbo.LoginHistories lh
JOIN dbo.Users u ON u.id = lh.userId
ORDER BY lh.loggedAt DESC;

SELECT * FROM Assets WHERE assetNumber='ASSET-0001';

ALTER TABLE Assets ADD status NVARCHAR(20) DEFAULT 'available';

-- List all columns of your table
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Assets';

ALTER TABLE dbo.Assets ADD createdBy NVARCHAR(255) NULL;

SELECT TOP 1 id FROM dbo.Assets ORDER BY id DESC;

ALTER TABLE dbo.Assets
ADD fields NVARCHAR(MAX) NULL;

ALTER TABLE users
ADD username NVARCHAR(255) NULL;

ALTER TABLE users ADD created_at DATETIME DEFAULT GETDATE() NOT NULL;
ALTER TABLE users ADD updated_at DATETIME DEFAULT GETDATE() NOT NULL;

DROP TABLE users;

ALTER TABLE users
ADD is_verified BIT NOT NULL DEFAULT 0,
    last_login DATETIME NULL,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    status NVARCHAR(50) NULL,
    phone NVARCHAR(50) NULL,
    department NVARCHAR(100) NULL,
    profile_image NVARCHAR(255) NULL;


    ALTER TABLE users
ADD is_verified BIT NOT NULL DEFAULT 0,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    status NVARCHAR(50) NULL,
    phone NVARCHAR(50) NULL,
    department NVARCHAR(100) NULL,
    profile_image NVARCHAR(255) NULL;

    ALTER TABLE users
ADD is_verified BIT NOT NULL DEFAULT 0,
    status NVARCHAR(50) NULL,
    phone NVARCHAR(50) NULL,
    department NVARCHAR(100) NULL,
    profile_image NVARCHAR(255) NULL;

-------------------------------------------------------------------------
    -- Add is_verified if missing
IF COL_LENGTH('users', 'is_verified') IS NULL
    ALTER TABLE users ADD is_verified BIT NOT NULL DEFAULT 0;

-- Add failed_login_attempts if missing
IF COL_LENGTH('users', 'failed_login_attempts') IS NULL
    ALTER TABLE users ADD failed_login_attempts INT NOT NULL DEFAULT 0;

-- Add status if missing
IF COL_LENGTH('users', 'status') IS NULL
    ALTER TABLE users ADD status NVARCHAR(50) NULL;

-- Add phone if missing
IF COL_LENGTH('users', 'phone') IS NULL
    ALTER TABLE users ADD phone NVARCHAR(50) NULL;

-- Add department if missing
IF COL_LENGTH('users', 'department') IS NULL
    ALTER TABLE users ADD department NVARCHAR(100) NULL;

-- Add profile_image if missing
IF COL_LENGTH('users', 'profile_image') IS NULL
    ALTER TABLE users ADD profile_image NVARCHAR(255) NULL;

    SELECT 
    id,
    username,
    email,
    is_verified,
    last_login,
    failed_login_attempts,
    status,
    phone,
    department,
    profile_image,
    created_at,
    updated_at
FROM users;

UPDATE users
SET is_verified = 1
WHERE email = 'tohidmahar5@gmail.com';

ALTER TABLE users
ALTER COLUMN last_login DATETIME2 NULL;

UPDATE users
SET last_login = GETDATE()
WHERE email = 'tohidmahar5@gmail.com';


ALTER TABLE users
ALTER COLUMN last_login DATETIME2 NULL;

ALTER TABLE users
ALTER COLUMN updated_at DATETIME2 NOT NULL;

---------------------------------------

-- 1️⃣ Find the name of the default constraint (you already have it: DF__Users__updated_a__7E37BEF6)
-- 2️⃣ Drop the default constraint
ALTER TABLE users
DROP CONSTRAINT DF__Users__updated_a__7E37BEF6;

-- 3️⃣ Alter the column type
ALTER TABLE users
ALTER COLUMN updated_at DATETIME2 NOT NULL;

-- 4️⃣ Recreate the default (if needed)
ALTER TABLE users
ADD CONSTRAINT DF_users_updated_at DEFAULT GETDATE() FOR updated_at;


ALTER TABLE users
ALTER COLUMN last_login DATETIME2 NULL;

select * from users

sp_help 'Users';

SELECT ... WHERE email = 'towngdg@ksp.gov.in';


SELECT email, password, isVerified FROM Users;

SELECT email, password, isVerified FROM Users WHERE email='aaogdg@ksp.gov.in';
UPDATE Users SET isVerified = 1 WHERE email='aaogdg@ksp.gov.in';


ALTER TABLE [users] DROP CONSTRAINT IF EXISTS UQ_users_email;

ALTER TABLE [users]
ADD CONSTRAINT UQ_users_email UNIQUE ([email]);

ALTER TABLE users
ADD notes NVARCHAR(MAX) NULL;

ALTER TABLE users
ADD CONSTRAINT UQ_users_email UNIQUE(email);

SELECT 
    name AS ConstraintName,
    type_desc,
    OBJECT_NAME(parent_object_id) AS TableName
FROM sys.objects
WHERE type_desc LIKE '%CONSTRAINT%' AND OBJECT_NAME(parent_object_id) = 'users';

ALTER TABLE users
ADD CONSTRAINT UQ_users_email UNIQUE(email);

SELECT name, type_desc FROM sys.objects 
WHERE type_desc LIKE '%CONSTRAINT%' AND OBJECT_NAME(parent_object_id) = 'users';

ALTER TABLE users DROP CONSTRAINT UQ__Users__F3DBC57217555E00;

SELECT username, email FROM users;

DELETE FROM users
WHERE email LIKE '%@ksp.gov.in';

DELETE FROM users WHERE email LIKE '%@ksp.gov.in';

TRUNCATE TABLE users;

DELETE FROM LoginHistory;
DELETE FROM Otp;
DELETE FROM Asset;
DELETE FROM Contact;
DELETE FROM users;

SELECT TABLE_SCHEMA, TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME LIKE '%';


-- Clear dependent tables first (foreign key constraints)
DELETE FROM dbo.LoginHistories;
DELETE FROM dbo.login_histories;
DELETE FROM dbo.login_history;
DELETE FROM dbo.Otps;
DELETE FROM dbo.contacts;
DELETE FROM dbo.Assets;

-- Finally, clear users
DELETE FROM dbo.Users;

BEGIN TRANSACTION;

-- Deletes here...

-- If everything looks fine
COMMIT;
-- If something breaks
-- ROLLBACK;


-- Keep only isVerified
ALTER TABLE Users DROP COLUMN is_verified;

ALTER TABLE Users
DROP CONSTRAINT DF__Users__is_verifi__02FC7413;


ALTER TABLE Users
DROP COLUMN is_verified;

sp_help 'Users';

ALTER TABLE otps
ADD user_id INT NULL;

-- Optional: Add foreign key if User table exists
ALTER TABLE otps
ADD CONSTRAINT FK_otps_user FOREIGN KEY (user_id) REFERENCES Users(id);

ALTER TABLE login_history
ADD email NVARCHAR(150) NOT NULL DEFAULT '';

sp_help 'login_history';

-- Allow NULL in login_history.user_id
ALTER TABLE login_history
ALTER COLUMN user_id INT NULL;

-- Optional: check email column exists
SELECT id, email FROM Users;
SELECT id, email, user_id FROM login_history;

SELECT email FROM Users;

UPDATE Users
SET email = LTRIM(RTRIM(LOWER(email)));

sp_help 'Assets';


use AssetDB

select * from Assets

select * from users

CREATE UNIQUE INDEX IX_Assets_AssetNumber
ON assets(asset_number);

ALTER TABLE assets
ADD asset_number NVARCHAR(50) NOT NULL;

CREATE UNIQUE INDEX IX_Assets_AssetNumber
ON assets(asset_number);

ALTER TABLE assets
ADD barcode NVARCHAR(50),
    category NVARCHAR(100),
    sub_category NVARCHAR(100),
    type NVARCHAR(100),
    brand NVARCHAR(100),
    model NVARCHAR(100),
    serial_number NVARCHAR(100),
    location NVARCHAR(100),
    assigned_officer INT NULL,
    year_of_purchase INT NULL,
    purchase_price FLOAT DEFAULT 0,
    supplier NVARCHAR(100),
    depreciation FLOAT DEFAULT 0,
    warranty NVARCHAR(100),
    property_register_sl_no NVARCHAR(50),
    pr_page_no NVARCHAR(50),
    pr_date DATE NULL,
    status NVARCHAR(50) DEFAULT 'available',
    notes NVARCHAR(MAX),
    remarks NVARCHAR(MAX),
    image_url NVARCHAR(255),
    fields NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE();

    SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'assets';

ALTER TABLE assets DROP COLUMN assetNumber;
ALTER TABLE assets DROP COLUMN subCategory;
ALTER TABLE assets DROP COLUMN serialNumber;
ALTER TABLE assets DROP COLUMN yearOfPurchase;
ALTER TABLE assets DROP COLUMN propertyRegisterSlNo;
ALTER TABLE assets DROP COLUMN prPageNo;
ALTER TABLE assets DROP COLUMN prDate;
ALTER TABLE assets DROP COLUMN createdAt;
ALTER TABLE assets DROP COLUMN updatedAt;
ALTER TABLE assets DROP COLUMN imageUrl;

-- Drop unique indexes on assetNumber
IF EXISTS (SELECT name FROM sys.indexes WHERE name = 'UQ_AssetNumber')
    DROP INDEX UQ_AssetNumber ON assets;

IF EXISTS (SELECT name FROM sys.indexes WHERE name = 'assets_asset_number')
    DROP INDEX assets_asset_number ON assets;

    SELECT name, type_desc 
FROM sys.objects 
WHERE parent_object_id = OBJECT_ID('assets') AND type_desc LIKE '%CONSTRAINT%';

ALTER TABLE assets
DROP CONSTRAINT UQ__Assets__6F132EC8B0507310;

ALTER TABLE assets
DROP CONSTRAINT UQ_AssetNumber;

ALTER TABLE assets
DROP COLUMN assetNumber,
DROP COLUMN subCategory,
DROP COLUMN serialNumber,
DROP COLUMN yearOfPurchase,
DROP COLUMN propertyRegisterSlNo,
DROP COLUMN prPageNo,
DROP COLUMN prDate,
DROP COLUMN createdAt,
DROP COLUMN updatedAt,
DROP COLUMN imageUrl;

ALTER TABLE assets DROP CONSTRAINT UQ__Assets__6F132EC8B0507310;
ALTER TABLE assets DROP CONSTRAINT UQ_AssetNumber;

-- Find the exact names of constraints on your table
SELECT name, type_desc
FROM sys.objects
WHERE parent_object_id = OBJECT_ID('assets') AND type_desc LIKE '%CONSTRAINT%';

ALTER TABLE assets
DROP COLUMN assetNumber;

ALTER TABLE assets
DROP COLUMN subCategory;

ALTER TABLE assets
DROP COLUMN serialNumber;

ALTER TABLE assets
DROP COLUMN yearOfPurchase;

ALTER TABLE assets
DROP COLUMN propertyRegisterSlNo;

ALTER TABLE assets
DROP COLUMN prPageNo;

ALTER TABLE assets
DROP COLUMN prDate;

ALTER TABLE assets
DROP COLUMN createdAt;

ALTER TABLE assets
DROP COLUMN updatedAt;

ALTER TABLE assets
DROP COLUMN imageUrl;

DROP INDEX assets_asset_number ON assets;

ALTER TABLE assets
DROP COLUMN assetNumber;

ALTER TABLE assets
ADD 
    barcode NVARCHAR(50),
    category NVARCHAR(100),
    sub_category NVARCHAR(100),
    type NVARCHAR(100),
    brand NVARCHAR(100),
    model NVARCHAR(100),
    serial_number NVARCHAR(100),
    location NVARCHAR(100),
    assigned_officer INT NULL,
    year_of_purchase INT NULL,
    purchase_price FLOAT DEFAULT 0,
    supplier NVARCHAR(100),
    depreciation FLOAT DEFAULT 0,
    warranty NVARCHAR(100),
    property_register_sl_no NVARCHAR(50),
    pr_page_no NVARCHAR(50),
    pr_date DATE NULL,
    status NVARCHAR(50) DEFAULT 'available',
    notes NVARCHAR(MAX),
    remarks NVARCHAR(MAX),
    image_url NVARCHAR(255),
    fields NVARCHAR(MAX),
    created_by NVARCHAR(100),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    asset_number NVARCHAR(50) NOT NULL;

    SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'assets';

ALTER TABLE assets
ADD 
    sub_category NVARCHAR(100),
    serial_number NVARCHAR(100),
    year_of_purchase INT NULL,
    purchase_price FLOAT DEFAULT 0,
    supplier NVARCHAR(100),
    depreciation FLOAT DEFAULT 0,
    property_register_sl_no NVARCHAR(50),
    pr_page_no NVARCHAR(50),
    pr_date DATE NULL,
    image_url NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE();

    CREATE UNIQUE INDEX IX_Assets_AssetNumber
ON assets(asset_number);

SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'assets';

ALTER TABLE [Users] ALTER COLUMN [email] NVARCHAR(510) NOT NULL;
GO

ALTER TABLE [Users] ADD CONSTRAINT UQ_Users_Email UNIQUE ([email]);
GO

SELECT name, type_desc
FROM sys.objects
WHERE parent_object_id = OBJECT_ID('Users') 
  AND type_desc LIKE '%CONSTRAINT%';

  ALTER TABLE [Users]
ALTER COLUMN [email] NVARCHAR(510) NOT NULL;

SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'assets';

-- Check data types
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Assets';

ALTER TABLE [Users] ADD CONSTRAINT UQ_Users_Email UNIQUE(email);

sp_help Users;


SELECT name, type_desc 
FROM sys.objects 
WHERE parent_object_id = OBJECT_ID('Users') AND type_desc LIKE '%CONSTRAINT%';

sp_help assets;

EXEC sp_rename 'assets.assignedOfficer', 'assigned_officer', 'COLUMN';

ALTER TABLE Assets
ALTER COLUMN assigned_officer INT NULL;

ALTER TABLE Assets
ALTER COLUMN assigned_officer INT NULL;

SELECT * FROM assets WHERE asset_number='ASSET-9999';

EXEC sp_help 'assets';

SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'assets';

ALTER TABLE assets
ADD remarks TEXT NULL;

SELECT * FROM assets WHERE asset_number = 'ASSET-1024';

ALTER TABLE assets ADD created_by NVARCHAR(150);

EXEC sp_columns assets;

ALTER TABLE assets ADD COLUMN install_date DATETIME NULL;

ALTER TABLE assets
ADD install_date DATETIME NULL;
-----------------------------------------------------------------------------

-- Check and add missing columns in 'assets' table

-- 1. Assigned Officer
IF COL_LENGTH('assets', 'assigned_officer') IS NULL
BEGIN
    ALTER TABLE assets ADD assigned_officer INT NULL;
END

-- 2. Year of Purchase
IF COL_LENGTH('assets', 'year_of_purchase') IS NULL
BEGIN
    ALTER TABLE assets ADD year_of_purchase INT NULL;
END

-- 3. Purchase Price
IF COL_LENGTH('assets', 'purchase_price') IS NULL
BEGIN
    ALTER TABLE assets ADD purchase_price FLOAT NOT NULL DEFAULT 0;
END

-- 4. Supplier
IF COL_LENGTH('assets', 'supplier') IS NULL
BEGIN
    ALTER TABLE assets ADD supplier NVARCHAR(150) NULL;
END

-- 5. Depreciation
IF COL_LENGTH('assets', 'depreciation') IS NULL
BEGIN
    ALTER TABLE assets ADD depreciation FLOAT NOT NULL DEFAULT 0;
END

-- 6. Warranty
IF COL_LENGTH('assets', 'warranty') IS NULL
BEGIN
    ALTER TABLE assets ADD warranty NVARCHAR(100) NULL;
END

-- 7. Property Register Serial Number
IF COL_LENGTH('assets', 'property_register_sl_no') IS NULL
BEGIN
    ALTER TABLE assets ADD property_register_sl_no NVARCHAR(50) NULL;
END

-- 8. PR Page Number
IF COL_LENGTH('assets', 'pr_page_no') IS NULL
BEGIN
    ALTER TABLE assets ADD pr_page_no NVARCHAR(50) NULL;
END

-- 9. PR Date
IF COL_LENGTH('assets', 'pr_date') IS NULL
BEGIN
    ALTER TABLE assets ADD pr_date DATETIME NULL;
END

-- 10. Install Date
IF COL_LENGTH('assets', 'install_date') IS NULL
BEGIN
    ALTER TABLE assets ADD install_date DATETIME NULL;
END

-- 11. Image URL
IF COL_LENGTH('assets', 'image_url') IS NULL
BEGIN
    ALTER TABLE assets ADD image_url NVARCHAR(255) NULL;
END

-- 12. Created By
IF COL_LENGTH('assets', 'created_by') IS NULL
BEGIN
    ALTER TABLE assets ADD created_by NVARCHAR(150) NULL;
END

-- 13. JSON fields
IF COL_LENGTH('assets', 'fields') IS NULL
BEGIN
    ALTER TABLE assets ADD fields NVARCHAR(MAX) NULL;
END
--------------------------------------------------------------------------------------------
use AssetDB

select * from assets

select * from users

SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Assets';
