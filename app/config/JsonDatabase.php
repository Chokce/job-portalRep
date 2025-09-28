<?php
class JsonDatabase {
    private $dataDir;
    
    public function __construct() {
        $this->dataDir = __DIR__ . '/../data/';
        $this->initializeFiles();
    }

    private function initializeFiles() {
        // Create data directory if it doesn't exist
        if (!file_exists($this->dataDir)) {
            mkdir($this->dataDir, 0777, true);
        }

        // Initialize users.json if it doesn't exist
        if (!file_exists($this->dataDir . 'users.json')) {
            file_put_contents($this->dataDir . 'users.json', json_encode([]));
        }

        // Initialize jobs.json if it doesn't exist
        if (!file_exists($this->dataDir . 'jobs.json')) {
            file_put_contents($this->dataDir . 'jobs.json', json_encode([]));
        }

        // Initialize applications.json if it doesn't exist
        if (!file_exists($this->dataDir . 'applications.json')) {
            file_put_contents($this->dataDir . 'applications.json', json_encode([]));
        }
    }

    private function readJsonFile($filename) {
        $filepath = $this->dataDir . $filename;
        if (file_exists($filepath)) {
            $content = file_get_contents($filepath);
            return json_decode($content, true) ?? [];
        }
        return [];
    }

    private function writeJsonFile($filename, $data) {
        $filepath = $this->dataDir . $filename;
        file_put_contents($filepath, json_encode($data, JSON_PRETTY_PRINT));
    }

    // User Methods
    public function createUser($userData) {
        $users = $this->readJsonFile('users.json');
        $userData['id'] = count($users) + 1;
        $userData['created_at'] = date('Y-m-d H:i:s');
        $userData['password'] = password_hash($userData['password'], PASSWORD_DEFAULT);
        $users[] = $userData;
        $this->writeJsonFile('users.json', $users);
        return $userData;
    }

    public function findUserByEmail($email) {
        $users = $this->readJsonFile('users.json');
        foreach ($users as $user) {
            if ($user['email'] === $email) {
                return $user;
            }
        }
        return null;
    }

    public function updateUser($id, $userData) {
        $users = $this->readJsonFile('users.json');
        foreach ($users as &$user) {
            if ($user['id'] === $id) {
                $user = array_merge($user, $userData);
                $this->writeJsonFile('users.json', $users);
                return $user;
            }
        }
        return null;
    }

    // Job Methods
    public function createJob($jobData) {
        $jobs = $this->readJsonFile('jobs.json');
        $jobData['id'] = count($jobs) + 1;
        $jobData['created_at'] = date('Y-m-d H:i:s');
        $jobs[] = $jobData;
        $this->writeJsonFile('jobs.json', $jobs);
        return $jobData;
    }

    public function getAllJobs() {
        return $this->readJsonFile('jobs.json');
    }

    public function getJobById($id) {
        $jobs = $this->readJsonFile('jobs.json');
        foreach ($jobs as $job) {
            if ($job['id'] === $id) {
                return $job;
            }
        }
        return null;
    }

    // Job Application Methods
    public function createApplication($applicationData) {
        $applications = $this->readJsonFile('applications.json');
        $applicationData['id'] = count($applications) + 1;
        $applicationData['created_at'] = date('Y-m-d H:i:s');
        $applicationData['status'] = 'pending';
        $applications[] = $applicationData;
        $this->writeJsonFile('applications.json', $applications);
        return $applicationData;
    }

    public function getApplicationsByUserId($userId) {
        $applications = $this->readJsonFile('applications.json');
        return array_filter($applications, function($application) use ($userId) {
            return $application['user_id'] === $userId;
        });
    }
}
?>
