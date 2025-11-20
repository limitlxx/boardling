# Boardling

A modern web application with Zcash blockchain integration.

## Project Structure

```
├── backend/           # Node.js backend API
├── frontend/          # React frontend application
├── config/            # Configuration files
│   └── zcash/         # Zcash node configurations
├── docs/              # Documentation
│   ├── api/           # API documentation
│   ├── architecture/  # Architecture documentation
│   ├── rpc/           # RPC documentation
│   └── zcash-setup/   # Zcash setup guides and scripts
└── Blockchain/        # Blockchain-related code
```

## Quick Start

### Zcash Setup
For Zcash blockchain integration:
```bash
cd docs/zcash-setup
./quick-install-zcash.sh
```

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Documentation

- **Zcash Setup**: See `docs/zcash-setup/README.md` for complete Zcash infrastructure setup
- **API Documentation**: See `docs/api/` for backend API documentation
- **Architecture**: See `docs/architecture/` for system architecture

## Configuration

- Zcash configurations: `config/zcash/`
- Backend environment: `backend/.env`
- Frontend configuration: `frontend/src/config/`

## Services

- **Backend API**: Node.js with Express
- **Frontend**: React application
- **Zcash Node**: Zebra (modern implementation)
- **Zcash Indexer**: Zaino (unified RPC interface)

## Development

The project uses a modern Zcash stack with Zebra + Zaino for optimal performance and developer experience.