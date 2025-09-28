<?php
require_once '../handlers/auth_handler.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    switch ($action) {
        case 'register':
            $response = AuthHandler::register([
                'name' => $_POST['name'] ?? '',
                'email' => $_POST['email'] ?? '',
                'password' => $_POST['password'] ?? '',
                'role' => $_POST['role'] ?? 'jobseeker'
            ]);
            break;
            
        case 'login':
            $response = AuthHandler::login(
                $_POST['email'] ?? '',
                $_POST['password'] ?? ''
            );
            break;
            
        case 'logout':
            $response = AuthHandler::logout();
            break;
            
        default:
            $response = ['success' => false, 'message' => 'Invalid action'];
    }
    
    echo json_encode($response);
}
?>
