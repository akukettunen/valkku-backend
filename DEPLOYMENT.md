# Heroku Deployment Guide

## Prerequisites

1. Heroku CLI installed
2. Git repository
3. Database (MySQL recommended)

## Environment Variables

Set these environment variables in Heroku:

### Required
- `DATABASE_URL` - MySQL database connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_ISSUER` - JWT issuer (e.g., "valkku-backend")
- `JWT_AUDIENCE` - JWT audience (e.g., "valkku-app")

### Optional
- `REFRESH_TOKEN_VALID_DAYS` - Days refresh tokens are valid (default: 90)
- `REFRESH_PEPPER` - Pepper for refresh tokens
- `INVITE_TOKEN_PEPPER` - Pepper for invite tokens
- `CORS_ORIGINS` - Comma-separated list of allowed CORS origins
- `NODE_ENV` - Environment (default: "production")

## Deployment Steps

### 1. Create Heroku App
```bash
heroku create your-app-name
```

### 2. Add Database Addon
```bash
heroku addons:create cleardb:ignite
```

### 3. Set Environment Variables
```bash
heroku config:set JWT_SECRET="your-super-secret-jwt-key"
heroku config:set JWT_ISSUER="valkku-backend"
heroku config:set JWT_AUDIENCE="valkku-app"
heroku config:set REFRESH_PEPPER="your-refresh-pepper"
heroku config:set INVITE_TOKEN_PEPPER="your-invite-pepper"
heroku config:set CORS_ORIGINS="https://yourdomain.com,https://app.yourdomain.com"
```

### 4. Deploy
```bash
git push heroku main
```


## Database Setup

The app expects a MySQL database with the following tables already created:
- `users`
- `teams`
- `team_users`
- `team_user_roles`
- `sessions`
- `invites`

## Health Check

Once deployed, check if the app is running:
```bash
heroku open
```

Visit `/health` endpoint to verify the application is healthy.

## Troubleshooting

### View Logs
```bash
heroku logs --tail
```

### Database Connection Issues
- Ensure `DATABASE_URL` is set correctly
- Check if the database addon is provisioned
- Verify database credentials

### Build Issues
- Ensure all dependencies are in `dependencies` (not `devDependencies`)
- Check if TypeScript compilation succeeds
- Verify the build script in `package.json`

## Scaling

To scale the application:
```bash
heroku ps:scale web=2
```

## Monitoring

- Use Heroku metrics to monitor performance
- Set up alerts for error rates
- Monitor database connections
