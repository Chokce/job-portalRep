# JobConnect Job Portal Backend

A comprehensive Node.js/Express backend API for a job portal application with user authentication, job management, and application tracking.

## Features

- **User Authentication & Authorization**
  - User registration and login
  - JWT-based authentication
  - Role-based access control (Job Seeker, Employer, Admin)
  - Password management

- **Job Management**
  - Post new job listings
  - Search and filter jobs
  - Update and delete job postings
  - Job application tracking

- **User Profiles**
  - Complete user profiles with skills and experience
  - Resume and profile picture uploads
  - Candidate search for employers

- **Application System**
  - Apply for jobs with cover letters
  - Track application status
  - Employer application management
  - Interview scheduling

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator
- **Security**: bcryptjs for password hashing
- **CORS**: Cross-origin resource sharing enabled

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jobportal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/jobportal
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system:
   ```bash
   # On Windows
   net start MongoDB
   
   # On macOS/Linux
   sudo systemctl start mongod
   ```

5. **Run the application**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/register` | User registration | Public |
| POST | `/login` | User login | Public |
| GET | `/me` | Get current user profile | Private |
| POST | `/change-password` | Change password | Private |
| POST | `/forgot-password` | Request password reset | Public |

### Job Routes (`/api/jobs`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/` | Post a new job | Private (Employers) |
| GET | `/` | Get all jobs with filters | Public |
| GET | `/:id` | Get specific job | Public |
| PUT | `/:id` | Update job | Private (Owner/Admin) |
| DELETE | `/:id` | Delete job | Private (Owner/Admin) |
| GET | `/employer/my-jobs` | Get employer's jobs | Private (Employers) |
| POST | `/:id/apply` | Apply for a job | Private (Job Seekers) |

### User Routes (`/api/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/profile` | Get current user profile | Private |
| PUT | `/profile` | Update user profile | Private |
| GET | `/:id` | Get public user profile | Public |
| POST | `/upload-resume` | Upload resume | Private |
| POST | `/upload-profile-picture` | Upload profile picture | Private |
| GET | `/search/candidates` | Search candidates | Private (Employers) |

### Application Routes (`/api/applications`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/my-applications` | Get user's applications | Private (Job Seekers) |
| GET | `/job/:jobId` | Get job applications | Private (Job Owner/Admin) |
| PUT | `/:id/status` | Update application status | Private (Job Owner/Admin) |
| PUT | `/:id/withdraw` | Withdraw application | Private (Applicant) |

## Database Models

### User Model
- Basic info: username, email, password, firstName, lastName
- Profile: phone, location, bio, skills, experience, education
- Files: resume, profilePicture
- Status: userType, isVerified, isActive

### Job Model
- Job details: title, company, location, jobType, description
- Requirements: requirements, responsibilities, experience, education
- Compensation: salary (min/max, currency, period)
- Metadata: postedBy, isActive, applicationCount, views

### Application Model
- Application details: job, applicant, coverLetter, resume
- Status tracking: status, reviewedDate, reviewedBy
- Interview: interviewDate, interviewLocation, interviewType
- Notes: notes, employerNotes

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Registration/Login**: Returns a JWT token
2. **Protected Routes**: Include token in Authorization header
   ```
   Authorization: Bearer <your-jwt-token>
   ```

## Error Handling

The API returns consistent error responses:
```json
{
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## Validation

All input data is validated using express-validator:
- Required fields
- Data types and formats
- Length restrictions
- Enum values for specific fields

## Security Features

- Password hashing with bcryptjs
- JWT token expiration
- Input validation and sanitization
- Role-based access control
- CORS configuration

## Development

### Running Tests
```bash
npm test
```

### Code Linting
```bash
npm run lint
```

### Database Seeding
```bash
npm run seed
```

## Production Deployment

1. **Environment Variables**
   - Set `NODE_ENV=production`
   - Use strong JWT secret
   - Configure production MongoDB URI

2. **Security**
   - Enable HTTPS
   - Set up proper CORS origins
   - Implement rate limiting
   - Add request logging

3. **Performance**
   - Enable compression
   - Set up caching
   - Use PM2 or similar process manager

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
