-- Query to view all regular customers
SELECT 
    id,
    email,
    username,
    full_name,
    role,
    auth_domain,
    is_active,
    email_verified,
    status,
    created_at,
    last_login_at
FROM users 
ORDER BY created_at DESC;

-- Query to view all admin users
SELECT 
    id,
    email,
    username,
    full_name,
    role,
    status,
    created_at,
    last_login_at
FROM admins 
ORDER BY created_at DESC;

-- Combined view of all users (both customers and admins)
SELECT 
    'customer' as user_type,
    id,
    email,
    username,
    full_name,
    role,
    is_active,
    email_verified,
    status,
    created_at,
    last_login_at
FROM users 

UNION ALL

SELECT 
    'admin' as user_type,
    id,
    email,
    username,
    full_name,
    role,
    is_active as is_active,
    null as email_verified,
    status,
    created_at,
    last_login_at
FROM admins 

ORDER BY created_at DESC;
