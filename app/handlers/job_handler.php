<?php
require_once '../config/JsonDatabase.php';

class JobHandler {
    private static $db;

    public static function init() {
        if (!self::$db) {
            self::$db = new JsonDatabase();
        }
    }

    public static function createJob($jobData) {
        self::init();
        
        // Validate required fields
        $required = ['title', 'company', 'location', 'description'];
        foreach ($required as $field) {
            if (empty($jobData[$field])) {
                return ['success' => false, 'message' => "Field '$field' is required"];
            }
        }

        // Create job
        $job = self::$db->createJob($jobData);
        return ['success' => true, 'job' => $job];
    }

    public static function getAllJobs() {
        self::init();
        return ['success' => true, 'jobs' => self::$db->getAllJobs()];
    }

    public static function getJob($id) {
        self::init();
        $job = self::$db->getJobById($id);
        
        if (!$job) {
            return ['success' => false, 'message' => 'Job not found'];
        }
        
        return ['success' => true, 'job' => $job];
    }

    public static function applyForJob($jobId, $userId, $applicationData) {
        self::init();
        
        // Validate job exists
        $job = self::$db->getJobById($jobId);
        if (!$job) {
            return ['success' => false, 'message' => 'Job not found'];
        }

        // Create application
        $applicationData['job_id'] = $jobId;
        $applicationData['user_id'] = $userId;
        $application = self::$db->createApplication($applicationData);
        
        return ['success' => true, 'application' => $application];
    }
}
?>
