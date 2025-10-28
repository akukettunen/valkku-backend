# Valkku Backend

A modern Express.js + TypeScript backend API server.

## Running locally
docker compose -f docker-compose.dev.yml up --build

## 🚀 Features

- **Express.js** - Fast, unopinionated web framework
- **TypeScript** - Type-safe JavaScript development
- **Node 22** - Latest LTS version with modern features
- **Security** - Helmet middleware for security headers
- **Logging** - Morgan HTTP request logging
- **CORS** - Cross-origin resource sharing support
- **Environment Variables** - Dotenv configuration

## 📋 Prerequisites

- Node.js 22.x or higher
- npm or yarn

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd valkku-backend
```

2. Install dependencies:
```bash
pnpm install
```

3. Create environment file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## 🚀 Usage

### Development
Start the development server with hot reload:
```bash
pnpm dev
```

### Production
Build and start the production server:
```bash
pnpm build
pnpm start
```

### Other Commands
```bash
pnpm clean    # Remove dist folder
pnpm build    # Build TypeScript to JavaScript
pnpm start    # Start production server
```

## 🌐 API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /api/status` - API status

## 📁 Project Structure

```
valkku-backend/
├── src/
│   └── server.ts          # Main server file
├── dist/                  # Compiled JavaScript (generated)
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── nodemon.json           # Development server configuration
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=8333
NODE_ENV=development
```

### TypeScript Configuration
The `tsconfig.json` is configured for:
- ES2022 target (Node 22 compatible)
- Strict type checking
- Source maps for debugging
- Declaration files generation

## 🚀 Development

The development server will automatically restart when you make changes to your TypeScript files.

## 📦 Build

The build process compiles TypeScript to JavaScript in the `dist/` folder, ready for production deployment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC License

NGROK
Log in with google
ngrok https 8333

Auth0 guthub login

## Example webhooks (req.body)
```js
{
  specversion: '1.0',
  id: 'evt_wW4bGMiZfHhpMLPFHjVJ41',
  source: 'urn:auth0:valkku.eu.auth0.com',
  type: 'user.created',
  time: '2025-09-05T16:42:25.267Z',
  data: {
    object: {
      user_id: 'auth0|507f1f77bcf86cd799439020',
      email: 'john.doe@gmail.com',
      email_verified: false,
      username: 'johndoe',
      phone_number: '+15555555555',
      phone_verified: false,
      created_at: '2025-02-01T12:34:56Z',
      updated_at: '2025-02-01T12:34:56Z',
      identities: [Array],
      app_metadata: [Object],
      user_metadata: [Object],
      picture: 'https://secure.gravatar.com/avatar/15626c5e0c749cb912f9d1ad48dba440?s=480&r=pg&d=https%3A%2F%2Fssl.gstatic.com%2Fs2%2Fprofiles%2Fimages%2Fsilhouette80.png',
      name: 'John Doe',
      nickname: 'John Doe',
      multifactor: [Array],
      last_ip: '10.0.0.1',
      last_login: '2025-02-01T12:34:56Z',
      logins_count: 42,
      blocked: false,
      given_name: 'John',
      family_name: 'Doe'
    }
  },
  a0purpose: 'test',
  a0stream: 'est_hhPLSs3gHbf5PAMKCsvwER',
  a0tenant: 'valkku'
}
```