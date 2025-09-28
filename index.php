<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Define the base path for the application
define('BASE_PATH', __DIR__);

// Allow from any origin for development purposes
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');    // cache for 1 day
}

// Handle OPTIONS method for CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");         

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

    exit(0);
}

// Set JSON header for API responses
header('Content-Type: application/json');

// Get the requested URI and parse it
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestUri = str_replace('/jobportal', '', $requestUri); // Adjust if your project is in a subfolder

// Simple router
switch ($requestUri) {
    case '/api/auth.php':
        require BASE_PATH . '/app/api/auth.php';
        break;
    case '/api/jobs.php':
        require BASE_PATH . '/app/api/jobs.php';
        break;
    // Add other API routes here
    default:
        // For non-API requests, serve static files or handle as needed
        // This part is crucial for the PHP built-in server
        if (file_exists(BASE_PATH . $requestUri) && !is_dir(BASE_PATH . $requestUri)) {
            return false; // Serve the requested file as is
        } else if (strpos($requestUri, '.html') !== false) {
            // If it's an HTML file, serve it directly
            header('Content-Type: text/html');
            readfile(BASE_PATH . $requestUri);
        } else if ($requestUri === '/' || $requestUri === '/index.html') {
            header('Content-Type: text/html');
            readfile(BASE_PATH . '/index.html');
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Not Found']);
        }
        break;
}
?>
