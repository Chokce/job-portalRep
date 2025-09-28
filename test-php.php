<?php
// Simple PHP test file
echo "PHP is working!<br>";
echo "Current directory: " . __DIR__ . "<br>";
echo "Jobs file path: " . __DIR__ . "/app/data/jobs.json<br>";

// Test file operations
$testFile = __DIR__ . "/app/data/test.txt";
$testDir = dirname($testFile);

echo "Test directory: " . $testDir . "<br>";
echo "Directory exists: " . (is_dir($testDir) ? "Yes" : "No") . "<br>";
echo "Directory writable: " . (is_writable($testDir) ? "Yes" : "No") . "<br>";

// Try to create directory
if (!is_dir($testDir)) {
    if (mkdir($testDir, 0755, true)) {
        echo "Created directory successfully<br>";
    } else {
        echo "Failed to create directory<br>";
    }
}

// Try to write test file
if (file_put_contents($testFile, "test") !== false) {
    echo "File write test: SUCCESS<br>";
    unlink($testFile); // Clean up
} else {
    echo "File write test: FAILED<br>";
}
?>
