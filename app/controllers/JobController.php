<?php
require_once '../models/Job.php';

class JobController {
    private $job;

    public function __construct($conn) {
        $this->job = new Job($conn);
    }

    public function handleCreateJob() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (!isset($_SESSION['user_id'])) {
                return ['success' => false, 'message' => 'Please login to post a job'];
            }

            $title = filter_input(INPUT_POST, 'title', FILTER_SANITIZE_STRING);
            $company = filter_input(INPUT_POST, 'company', FILTER_SANITIZE_STRING);
            $location = filter_input(INPUT_POST, 'location', FILTER_SANITIZE_STRING);
            $type = filter_input(INPUT_POST, 'type', FILTER_SANITIZE_STRING);
            $description = filter_input(INPUT_POST, 'description', FILTER_SANITIZE_STRING);
            $salary = filter_input(INPUT_POST, 'salary', FILTER_SANITIZE_NUMBER_FLOAT);
            $user_id = $_SESSION['user_id'];

            if (empty($title) || empty($company) || empty($location) || empty($type) || empty($description)) {
                return ['success' => false, 'message' => 'All fields are required'];
            }

            if ($this->job->createJob($title, $company, $location, $type, $description, $salary, $user_id)) {
                return ['success' => true, 'message' => 'Job posted successfully'];
            } else {
                return ['success' => false, 'message' => 'Failed to post job'];
            }
        }
    }

    public function handleGetJobs() {
        $filters = [];
        
        if (isset($_GET['keyword'])) {
            $filters['keyword'] = filter_input(INPUT_GET, 'keyword', FILTER_SANITIZE_STRING);
        }
        if (isset($_GET['location'])) {
            $filters['location'] = filter_input(INPUT_GET, 'location', FILTER_SANITIZE_STRING);
        }
        if (isset($_GET['type'])) {
            $filters['type'] = filter_input(INPUT_GET, 'type', FILTER_SANITIZE_STRING);
        }

        return $this->job->getJobs($filters);
    }

    public function handleGetJob($id) {
        return $this->job->getJobById($id);
    }

    public function handleUpdateJob($id) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (!isset($_SESSION['user_id'])) {
                return ['success' => false, 'message' => 'Please login to update a job'];
            }

            $title = filter_input(INPUT_POST, 'title', FILTER_SANITIZE_STRING);
            $company = filter_input(INPUT_POST, 'company', FILTER_SANITIZE_STRING);
            $location = filter_input(INPUT_POST, 'location', FILTER_SANITIZE_STRING);
            $type = filter_input(INPUT_POST, 'type', FILTER_SANITIZE_STRING);
            $description = filter_input(INPUT_POST, 'description', FILTER_SANITIZE_STRING);
            $salary = filter_input(INPUT_POST, 'salary', FILTER_SANITIZE_NUMBER_FLOAT);

            if (empty($title) || empty($company) || empty($location) || empty($type) || empty($description)) {
                return ['success' => false, 'message' => 'All fields are required'];
            }

            if ($this->job->updateJob($id, $title, $company, $location, $type, $description, $salary)) {
                return ['success' => true, 'message' => 'Job updated successfully'];
            } else {
                return ['success' => false, 'message' => 'Failed to update job'];
            }
        }
    }

    public function handleDeleteJob($id) {
        if (!isset($_SESSION['user_id'])) {
            return ['success' => false, 'message' => 'Please login to delete a job'];
        }

        if ($this->job->deleteJob($id)) {
            return ['success' => true, 'message' => 'Job deleted successfully'];
        } else {
            return ['success' => false, 'message' => 'Failed to delete job'];
        }
    }
}
