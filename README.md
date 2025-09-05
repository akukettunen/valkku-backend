# Valkku Backend

A modern Express.js + TypeScript backend API server.

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
PORT=3000
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