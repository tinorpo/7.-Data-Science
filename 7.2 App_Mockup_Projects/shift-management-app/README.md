# Shift Management Application

A web application for managing employee shifts with SAML authentication.

## Features

- SAML Authentication with Google and Microsoft Office
- View predefined shifts for the month
- Exchange shifts with colleagues based on business rules
- Responsive design for desktop and mobile

## Tech Stack

### Frontend
- React.js
- React Router for navigation
- Firebase Authentication for SAML login
- Tailwind CSS for styling

### Backend
- Node.js with Express
- MongoDB for database
- JWT for authentication

## Project Structure

```
shift-management-app/
├── public/                 # Static assets
├── src/                    # Frontend source code
│   ├── components/         # Reusable components
│   ├── pages/              # Page components
│   ├── services/           # API services
│   └── utils/              # Utility functions
├── server/                 # Backend source code
│   ├── controllers/        # Route controllers
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   └── middleware/         # Middleware functions
└── package.json            # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Business Rules for Shift Exchange

1. Employees can only exchange shifts with colleagues of the same role
2. Shift exchanges must be approved by a manager
3. Employees cannot exchange shifts that are less than 24 hours away
4. Employees cannot have overlapping shifts
