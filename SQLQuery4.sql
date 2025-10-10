USE [master]
GO
CREATE CREDENTIAL [##xp_cmdshell_proxy_account##] WITH IDENTITY = N'asset_user', SECRET = N'Asset@123'
GO

-- Create Login if not exists
IF NOT EXISTS (SELECT * FROM sys.sql_logins WHERE name = 'asset_user')
BEGIN
    CREATE LOGIN asset_user WITH PASSWORD = 'Asset@123', CHECK_POLICY = OFF;
END
GO

-- Create user in master (or use your AssetDB)
CREATE USER asset_user FOR LOGIN asset_user;
ALTER SERVER ROLE sysadmin ADD MEMBER asset_user;
GO

USE AssetDB;
GO

DROP USER asset_user;
GO

CREATE USER asset_user FOR LOGIN asset_user;
ALTER ROLE db_owner ADD MEMBER asset_user;
GO

-- Check if login exists
SELECT name, type_desc FROM sys.server_principals WHERE name = 'asset_user';
