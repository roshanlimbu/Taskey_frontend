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

## Screenshots

Here is a preview of the Taskey frontend UI:

![Taskey Kanban and Dashboard](public/assets/image.png)

## OpenAI Project Report Generation

You can now generate detailed project reports directly from the project dashboard. When you click the "Generate Report" button, the frontend calls the backend, which uses OpenAI GPT-4 to create a report based on the project and its tasks. The result is shown in an alert (or can be improved to show in a modal).

No manual prompt writing is needed—the backend handles all prompt construction.

## License
This project is open-sourced under the MIT license.
