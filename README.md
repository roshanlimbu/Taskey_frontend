# Taskey Frontend

Taskey Frontend is a modern web application built with Angular, serving as the user interface for the Taskey project management platform. It interacts with the Taskey backend via RESTful APIs and provides a responsive, user-friendly experience.

## Features
- User authentication (GitHub OAuth)
- Project dashboard and management
- Task creation, assignment, and tracking
- User profile and activity views
- Offline support (PWA)

## Requirements
- Node.js >= 18
- npm >= 9

## Installation
1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd Taskey_frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```

## Running the Application
- **Development server:**
  ```bash
  npm start
  ```
  Open [http://localhost:4200](http://localhost:4200) in your browser.

## Building for Production
- **Build the app:**
  ```bash
  npm run build
  ```
  The build artifacts will be stored in the `dist/` directory.

## Project Structure
- `src/app/pages/` - Main application pages (dashboard, login, admin, etc.)
- `src/app/components/` - Reusable UI components
- `src/app/services/` - API and business logic services
- `src/app/auth/` - Authentication logic
- `src/app/routes/` - App routing

## Testing
- **Unit tests:**
  ```bash
  npm test
  ```
- **End-to-end tests:**
  (Configure your preferred e2e framework)

## License
This project is open-sourced under the MIT license.
