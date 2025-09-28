<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Load jobs from JSON file
$jobsFile = __DIR__ . '/../data/jobs.json';
$jobs = [];

if (file_exists($jobsFile)) {
    $jobsData = file_get_contents($jobsFile);
    $jobs = json_decode($jobsData, true) ?: [];
}

// Filter active jobs only
$activeJobs = array_filter($jobs, function($job) {
    return $job['status'] === 'active';
});

// Sort by posted date (newest first)
usort($activeJobs, function($a, $b) {
    return strtotime($b['postedDate']) - strtotime($a['postedDate']);
});

echo json_encode(array_values($activeJobs));
?>
