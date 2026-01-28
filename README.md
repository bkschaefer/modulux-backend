![Modulux](README_IMAGE.png)

[![CI](https://github.com/bkschaefer/modulux-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/bkschaefer/modulux-backend/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/license-GPL--3.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-green)

# Modulux Backend

A headless CMS backend focused on simplicity, featuring dynamic schema creation for content management. This REST API server enables both developers and content editors to manage CMS content with ease.

## Features

- **Dynamic Schema Creation** - Create and modify content schemas on the fly
- **JWT Authentication** - Secure token-based authentication
- **Role-Based Permissions** - Granular access control system
- **AI Integration** - Powered by Vercel AI SDK and Ollama
- **S3 Storage** - AWS S3 integration for file uploads
- **Email Service** - User invitations and password reset via Brevo
- **API Documentation** - Interactive Swagger/OpenAPI docs
- **Testing** - Jest unit and integration tests
- **Docker Ready** - Containerized deployment support

## Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js / Bun |
| **Framework** | Express.js |
| **Language** | TypeScript (strict mode) |
| **Database** | MongoDB + Mongoose ODM |
| **Authentication** | JWT + bcryptjs |
| **File Storage** | AWS S3 (multer-s3) |
| **Email** | Brevo API + Nodemailer |
| **AI/ML** | Vercel AI SDK + Ollama |
| **API Docs** | Swagger (OpenAPI 3.0) |
| **Testing** | Jest + MongoDB Memory Server |
| **Logging** | Winston |

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 8
- Docker (for MongoDB)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bkschaefer/modulux-backend.git
   cd modulux-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   docker compose up -d
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Access API documentation**

   Open http://localhost:3000/api-docs

## API Documentation

Interactive API documentation is available via Swagger UI when the server is running:

- **Development:** http://localhost:3000/api-docs

### Main API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | User authentication |
| `POST` | `/api/auth/renew` | Renew JWT token |
| `GET` | `/api/collection` | List all collections |
| `POST` | `/api/collection` | Create new collection |
| `GET` | `/api/collection/:name` | Get collection with entries |
| `PATCH` | `/api/collection/:name/schema` | Update collection schema |
| `POST` | `/api/collection/:name/entry` | Add entry to collection |
| `POST` | `/api/ai/command` | AI-powered content generation |

## Project Structure

```
src/
├── app.ts              # Express app configuration
├── index.ts            # Application entry point
├── env.ts              # Environment variable validation
├── logger.ts           # Winston logger setup
├── swagger.ts          # Swagger/OpenAPI configuration
├── errors/             # Custom error classes
├── helper/             # Utility functions
├── middleware/         # Express middleware (auth, validation)
├── model/              # Mongoose models
├── routes/             # API route handlers
├── services/           # Business logic layer
└── types/              # TypeScript type definitions

test/                   # Jest test files
├── api/                # API integration tests
└── service/            # Service unit tests
```

See the source code for detailed architecture documentation.

## Testing

Run the test suite:

```bash
npm test
```

Run with coverage:

```bash
npm test -- --coverage
```

## Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

**With Bun (recommended):**
```bash
npm start
```

**With Node.js:**
```bash
npm run start:node
```

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXP` | JWT expiration time in seconds |
| `AWS_ACCESS_KEY_ID` | AWS credentials for S3 |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_BUCKET_NAME` | S3 bucket name |
| `AWS_BUCKET_REGION` | S3 bucket region |
| `BREVO_API_USER` | Brevo email service user |
| `BREVO_API_PASS` | Brevo email service password |

See [.env.example](.env.example) for full configuration options.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (Bun) |
| `npm run build:tsc` | Build with TypeScript compiler |
| `npm start` | Start production server (Bun) |
| `npm run start:node` | Start production server (Node.js) |
| `npm test` | Run tests with coverage |
| `npm run format` | Format code with Prettier |

## Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) before submitting Pull Requests.

## Author

Benedikt Schäfer

## Related Projects

- **Modulux Dashboard** - Frontend application for content management
- **Documentation** - [docs.modulux.io](https://docs.modulux.io)

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

**Key Points:**
- Commercial use allowed
- Modification allowed
- Distribution allowed
- Same license required for derivatives
- Source code must be disclosed
