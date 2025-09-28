<?php
require_once '../models/Auth.php';

class AuthController {
    private $auth;

    public function __construct($conn) {
        $this->auth = new Auth($conn);
    }

    public function handleRegister() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $username = filter_input(INPUT_POST, 'username', FILTER_SANITIZE_STRING);
            $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
            $password = $_POST['password'];

            if (empty($username) || empty($email) || empty($password)) {
                return ['success' => false, 'message' => 'All fields are required'];
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return ['success' => false, 'message' => 'Invalid email format'];
            }

            if ($this->auth->register($username, $email, $password)) {
                return ['success' => true, 'message' => 'Registration successful'];
            } else {
                return ['success' => false, 'message' => 'Registration failed'];
            }
        }
    }

    public function handleLogin() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
            $password = $_POST['password'];

            if (empty($email) || empty($password)) {
                return ['success' => false, 'message' => 'Email and password are required'];
            }

            if ($this->auth->login($email, $password)) {
                return ['success' => true, 'message' => 'Login successful'];
            } else {
                return ['success' => false, 'message' => 'Invalid email or password'];
            }
        }
    }

    public function handleLogout() {
        if ($this->auth->logout()) {
            header('Location: /login.php');
            exit;
        }
    }
}
