<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Route requests to appropriate handlers
$request = $_SERVER['REQUEST_URI'];

if (strpos($request, '/api/auth') !== false) {
    require __DIR__ . '/api/auth.php';
} elseif (strpos($request, '/api/jobs') !== false) {
    require __DIR__ . '/api/jobs.php';
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}
?>
