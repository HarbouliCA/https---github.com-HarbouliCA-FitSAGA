# FitSaga Admin Portal

The FitSaga Admin Portal is a web application built with Next.js and Firebase for managing fitness activities, sessions, and users.

## Features

- User Management: Create and manage user accounts
- Activity Management: Create and manage fitness activities
- Session Management: Schedule and manage fitness sessions
- Dashboard: View key statistics and metrics

## Tech Stack

- **Next.js**: React framework for building the web application
- **TypeScript**: For type safety and better developer experience
- **Firebase**: For authentication, database (Firestore), and storage
- **Tailwind CSS**: For styling the application

## Getting Started

### Prerequisites

- Node.js 14.x or later
- npm or yarn
- Firebase project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fitsaga-admin-portal.git
cd fitsaga-admin-portal
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with your Firebase configuration:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

Alternatively, you can run the provided script to create the `.env.local` file:
```bash
node create-env.js
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
fitsaga-admin-portal/
├── public/                  # Static files
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── activities/      # Activity management pages
│   │   ├── dashboard/       # Dashboard page
│   │   ├── login/           # Login page
│   │   ├── sessions/        # Session management pages
│   │   ├── users/           # User management pages
│   │   ├── globals.css      # Global styles
│   │   └── layout.tsx       # Root layout component
│   ├── components/          # Reusable components
│   ├── context/             # React context providers
│   │   └── AuthContext.tsx  # Authentication context
│   ├── lib/                 # Utility functions and libraries
│   │   └── firebase.ts      # Firebase initialization
│   └── types/               # TypeScript type definitions
├── .env.local               # Environment variables (create this file)
├── create-env.js            # Script to create .env.local
├── next.config.js           # Next.js configuration
├── package.json             # Project dependencies
├── tailwind.config.js       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## Development Guidelines

- Use TypeScript for all new code
- Add 'use client' directive to components that use React hooks
- Follow the existing project structure for new features
- Ensure proper error handling for Firebase operations
- Check for null values of Firebase services before using them

## Deployment

The application can be deployed to Vercel, Netlify, or any other platform that supports Next.js applications.

```bash
npm run build
# or
yarn build
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
