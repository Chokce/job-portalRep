<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get form data
$jobTitle = trim($_POST['jobTitle'] ?? '');
$companyName = trim($_POST['companyName'] ?? '');
$location = trim($_POST['location'] ?? '');
$jobType = trim($_POST['jobType'] ?? '');
$salaryRange = trim($_POST['salaryRange'] ?? '');
$experience = trim($_POST['experience'] ?? '');
$jobDescription = trim($_POST['jobDescription'] ?? '');
$requirements = trim($_POST['requirements'] ?? '');
$benefits = trim($_POST['benefits'] ?? '');
$contactEmail = trim($_POST['contactEmail'] ?? '');
$applicationDeadline = trim($_POST['applicationDeadline'] ?? '');

// Validate required fields
if (empty($jobTitle) || empty($companyName) || empty($location) || 
    empty($jobType) || empty($salaryRange) || empty($jobDescription) || 
    empty($contactEmail)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please fill in all required fields']);
    exit;
}

// Validate email
if (!filter_var($contactEmail, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please enter a valid email address']);
    exit;
}

// Load existing jobs
$jobsFile = __DIR__ . '/../data/jobs.json';
$jobs = [];

// Create directory if it doesn't exist
$dataDir = dirname($jobsFile);
if (!is_dir($dataDir)) {
    if (!mkdir($dataDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create data directory']);
        exit;
    }
}

// Create file if it doesn't exist
if (!file_exists($jobsFile)) {
    if (file_put_contents($jobsFile, '[]') === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create jobs file']);
        exit;
    }
}

if (file_exists($jobsFile)) {
    $jobsData = file_get_contents($jobsFile);
    if ($jobsData === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to read jobs file']);
        exit;
    }
    $jobs = json_decode($jobsData, true);
    if ($jobs === null) {
        $jobs = [];
    }
}

// Create new job entry
$newJob = [
    'id' => count($jobs) + 1,
    'jobTitle' => $jobTitle,
    'companyName' => $companyName,
    'location' => $location,
    'jobType' => $jobType,
    'salaryRange' => $salaryRange,
    'experience' => $experience,
    'jobDescription' => $jobDescription,
    'requirements' => $requirements,
    'benefits' => $benefits,
    'contactEmail' => $contactEmail,
    'applicationDeadline' => $applicationDeadline,
    'postedDate' => date('Y-m-d H:i:s'),
    'status' => 'active'
];

// Add to jobs array
$jobs[] = $newJob;

// Save to file
$result = file_put_contents($jobsFile, json_encode($jobs, JSON_PRETTY_PRINT));
if ($result !== false) {
    echo json_encode([
        'success' => true,
        'message' => 'Job posted successfully!',
        'jobId' => $newJob['id']
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to save job posting',
        'debug' => [
            'file_path' => $jobsFile,
            'directory_writable' => is_writable(dirname($jobsFile)),
            'file_exists' => file_exists($jobsFile),
            'file_writable' => file_exists($jobsFile) ? is_writable($jobsFile) : 'file does not exist'
        ]
    ]);
}
?>
