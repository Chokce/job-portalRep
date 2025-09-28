<?php
session_start();
require_once '../config/database.php';

class Auth {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function register($username, $email, $password) {
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt = $this->conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $username, $email, $hashed_password);
        
        return $stmt->execute();
    }

    public function login($email, $password) {
        $stmt = $this->conn->prepare("SELECT id, username, password FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            if (password_verify($password, $user['password'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                return true;
            }
        }
        return false;
    }

    public function isLoggedIn() {
        return isset($_SESSION['user_id']);
    }

    public function logout() {
        session_destroy();
        return true;
    }
}
