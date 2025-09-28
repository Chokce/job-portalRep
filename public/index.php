<?php
session_start();
require_once '../config/database.php';

// Simple routing
$request = $_SERVER['REQUEST_URI'];
$base = '/jobportal'; // Adjust this if needed based on your setup

// Remove base path from request
$request = str_replace($base, '', $request);

// Split URL into segments
$segments = explode('/', trim($request, '/'));
$route = $segments[0] ?? 'home';

// Set current page for navigation highlighting
$currentPage = $route;

// Basic routing
switch ($route) {
    case '':
    case 'home':
        require_once '../app/controllers/HomeController.php';
        $controller = new HomeController($conn);
        $content = $controller->index();
        break;
        
    case 'jobs':
        require_once '../app/controllers/JobController.php';
        $controller = new JobController($conn);
        $action = $segments[1] ?? 'index';
        
        switch ($action) {
            case 'post':
                $content = $controller->create();
                break;
            case 'view':
                $id = $segments[2] ?? null;
                $content = $controller->view($id);
                break;
            default:
                $content = $controller->index();
                break;
        }
        break;
        
    case 'auth':
        require_once '../app/controllers/AuthController.php';
        $controller = new AuthController($conn);
        $action = $segments[1] ?? 'login';
        
        switch ($action) {
            case 'login':
                $content = $controller->login();
                break;
            case 'register':
                $content = $controller->register();
                break;
            case 'logout':
                $controller->logout();
                break;
            default:
                header('Location: /login');
                exit;
        }
        break;
        
    default:
        http_response_code(404);
        $content = '<h1>404 - Page Not Found</h1>';
        break;
}

// Include the layout
require_once '../app/views/layouts/main.php';
