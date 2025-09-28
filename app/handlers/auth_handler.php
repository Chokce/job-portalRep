<?php
session_start();
require_once '../models/Auth.php';

// Initialize Auth class
$auth = new Auth();

// Handle POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = isset($_POST['action']) ? $_POST['action'] : '';

    switch ($action) {
        case 'register':
            handleRegistration($auth);
            break;
        case 'login':
            handleLogin($auth);
            break;
        case 'logout':
            handleLogout();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
}

function handleRegistration($auth) {
    // Get form data
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $role = $_POST['role'] ?? 'jobseeker'; // Default role

    // Validate input
    if (empty($name) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Please fill all required fields']);
        return;
    }

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        return;
    }

    // Check if email already exists
    if ($auth->emailExists($email)) {
        echo json_encode(['success' => false, 'message' => 'Email already registered']);
        return;
    }

    // Set user properties
    $auth->name = $name;
    $auth->email = $email;
    $auth->password = $password;
    $auth->role = $role;

    // Register user
    if ($auth->register()) {
        echo json_encode(['success' => true, 'message' => 'Registration successful']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Registration failed']);
    }
}

function handleLogin($auth) {
    // Get form data
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    // Validate input
    if (empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Please fill all required fields']);
        return;
    }

    // Attempt login
    if ($auth->login($email, $password)) {
        // Set session variables
        $_SESSION['user_id'] = $auth->id;
        $_SESSION['user_name'] = $auth->name;
        $_SESSION['user_email'] = $auth->email;
        $_SESSION['user_role'] = $auth->role;

        echo json_encode([
            'success' => true, 
            'message' => 'Login successful',
            'user' => [
                'name' => $auth->name,
                'email' => $auth->email,
                'role' => $auth->role
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
    }
}

function handleLogout() {
    // Destroy session
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logout successful']);
}
?>
