<?php
require_once '../handlers/job_handler.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    switch ($action) {
        case 'create':
            $response = JobHandler::createJob([
                'title' => $_POST['title'] ?? '',
                'company' => $_POST['company'] ?? '',
                'location' => $_POST['location'] ?? '',
                'salary' => $_POST['salary'] ?? '',
                'type' => $_POST['type'] ?? '',
                'description' => $_POST['description'] ?? ''
            ]);
            break;
            
        case 'apply':
            if (!isset($_SESSION['user_id'])) {
                $response = ['success' => false, 'message' => 'Please login to apply'];
                break;
            }
            
            $response = JobHandler::applyForJob(
                $_POST['job_id'] ?? '',
                $_SESSION['user_id'],
                [
                    'cover_letter' => $_POST['cover_letter'] ?? '',
                    'resume' => $_POST['resume'] ?? ''
                ]
            );
            break;
            
        default:
            $response = ['success' => false, 'message' => 'Invalid action'];
    }
    
    echo json_encode($response);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'list':
            $response = JobHandler::getAllJobs();
            break;
            
        case 'get':
            $response = JobHandler::getJob($_GET['id'] ?? 0);
            break;
            
        default:
            $response = ['success' => false, 'message' => 'Invalid action'];
    }
    
    echo json_encode($response);
}
?>
