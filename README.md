# JobConnect - Online Job Portal

## Description

JobConnect is a full-featured online job portal designed to connect job seekers with employers. It provides a platform for users to search for job opportunities, apply for them, and for employers to post new job openings. The application is built with a modern technology stack and features a clean, user-friendly interface.

## Features

- **User Authentication:** Secure user registration and login system.
- **Job Search & Filtering:** Users can search for jobs by keywords, location, job type, and salary range.
- **Job Posting:** Employers can post new job openings with detailed descriptions.
- **Detailed Job Views:** A dedicated page for each job with complete details.
- **User Dashboard:** A personalized dashboard for users to manage their profile and applications (future implementation).
- **External API Integration:** Aggregates job listings from external sources (like "Bobs APIs") to provide a wider range of opportunities.
- **Responsive Design:** The application is fully responsive and works on all devices.

## Technology Stack

- **Frontend:**
  - HTML5
  - CSS3
  - JavaScript (ES6 Modules)
- **Backend:**
  - Node.js
  - Express.js
- **Database:**
  - Google Firestore (for internal job postings)
- **Deployment:**
  - Classic Firebase Hosting

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your local machine.
- A [Firebase](https://firebase.google.com/) project with Firestore enabled.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd job-board
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Configuration

1.  **Firebase Setup:**
    - Open `public/assets/js/firebase-init.js`.
    - Replace the placeholder `firebaseConfig` object with your actual Firebase project configuration.

2.  **External Job Service (Optional):**
    - If you are integrating with an external job API:
    - Open `public/assets/js/services/external-job-service.js`.
    - Replace the placeholder `API_ENDPOINT` and `API_KEY` with the credentials from your job provider (e.g., Bobs APIs).

### Running the Application

- **Start the server:**
  ```bash
  npm start
  ```
- Open your browser and navigate to `http://localhost:3000` (or the port specified in your `server.js`).

## Contributing

Contributions are welcome! If you'd like to improve the project, please follow these steps:

1.  Fork the repository.
2.  Create a new feature branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes and commit them (`git commit -m 'Add some feature'`).
4.  Push to the branch (`git push origin feature/your-feature-name`).
5.  Open a Pull Request.

## License

This project is licensed under the MIT License.
