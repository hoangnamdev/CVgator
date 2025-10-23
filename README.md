# CVgator

A CV sharing platform with discussion and business features.

## Features

- User authentication (login/register)
- CV upload and sharing
- Discussion forum
- Business-focused features for hiring

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally on port 27017)

### Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Make sure MongoDB is running on your local machine

4. Start the server:
   ```bash
   npm start
   ```

   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Current Features

### Landing Page
- Clean, modern design with gradient background
- Login form with username and password fields
- Register button that redirects to registration page

### Registration Page
- Email, username, and password fields
- Client-side and server-side validation
- Email format validation
- Username and password character restrictions (letters and numbers only)

### Authentication
- Secure password hashing using bcrypt
- Database validation for existing users
- Proper error handling and user feedback

## API Endpoints

- `POST /api/login` - User login
- `POST /api/register` - User registration
- `GET /` - Landing page
- `GET /register` - Registration page

## Project Structure

```
cvgator/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── public/            # Frontend files
│   ├── index.html     # Landing page
│   ├── register.html  # Registration page
│   ├── styles.css     # CSS styles
│   ├── script.js      # Login functionality
│   └── register.js    # Registration functionality
└── README.md          # This file
```

## Next Steps

- Create main application page after successful login
- Implement CV upload functionality
- Add discussion forum features
- Implement business dashboard for hiring
