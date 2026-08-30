# POS System - Desktop Application

A modern Point of Sale (POS) system built with Electron, React, and Prisma.

## Features

### 🚀 Core Features
- **Dashboard**: Real-time business overview with analytics
- **POS Billing**: Quick and efficient billing with barcode scanning
- **Product Management**: Add, edit, delete, and manage products
- **Category Management**: Organize products with categories
- **Supplier Management**: Track and manage suppliers
- **Purchase Orders**: Create and manage purchase orders
- **Stock Management**: Track inventory and stock adjustments
- **Sales History**: View and manage sales transactions
- **User Management**: Admin control over system users

### 📊 Reports & Analytics
- Sales Reports with charts and analytics
- Inventory Reports with stock status
- Category-wise distribution charts
- Payment method analytics

### ⚙️ Settings & Configuration
- Store information management
- Tax rate configuration
- Receipt customization
- Currency settings
- Database backup and restore

### 🔒 Security
- Role-based access control (Admin, Manager, Cashier)
- Secure authentication with bcrypt
- Session management
- Protected routes

## Technology Stack

- **Frontend**: React 18 with Hooks
- **Backend**: Electron
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Printing**: React-to-Print

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/pos-system.git
cd pos-system
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Setup database:
\`\`\`bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

## Default Admin Credentials

After installation, use given credentials to login:

⚠️ **Important**: Change these credentials after first login!

## Project Structure

\`\`\`
desktop-pos/
├── electron/           # Electron main process
│   ├── main.cjs        # Main electron file
│   └── preload.cjs     # Preload script
├── prisma/             # Database schema and migrations
│   ├── schema.prisma
│   └── seed.js
├── src/
│   ├── components/     # Reusable components
│   ├── context/        # React context providers
│   ├── layouts/        # Layout components
│   ├── pages/          # Page components
│   │   ├── Dashboard.jsx
│   │   ├── POS.jsx
│   │   ├── Products.jsx
│   │   └── ...
│   ├── routes/         # Routing configuration
│   └── index.css       # Global styles
├── package.json
├── tailwind.config.js
└── README.md
\`\`\`

## Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build the application
- \`npm run electron\` - Run Electron app
- \`npm run electron:build\` - Build for production
- \`npm run seed\` - Seed the database with default data

## Development Workflow

1. **Feature Development**: Create a new branch from `dev`
2. **Testing**: Test features thoroughly before merging
3. **Pull Requests**: Submit PRs to the `dev` branch

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, please contact the development team or create an issue in the repository.

## Acknowledgments

- Built using Electron and React
- Special thanks to all contributors
\`\`\`

## 4. Create `.gitattributes` (Optional)

Create a `.gitattributes` file to handle line endings:

```bash
# .gitattributes
* text=auto
*.js text eol=lf
*.jsx text eol=lf
*.json text eol=lf
*.css text eol=lf
*.html text eol=lf
*.cjs text eol=lf
*.prisma text eol=lf
*.md text eol=lf
*.bat text eol=crlf
*.sh text eol=lf
*.png binary
*.jpg binary
*.ico binary
*.db binary