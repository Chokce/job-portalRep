<?php
// Supabase configuration
define('SUPABASE_URL', 'YOUR_SUPABASE_PROJECT_URL');
define('SUPABASE_KEY', 'YOUR_SUPABASE_ANON_KEY');
define('SUPABASE_JWT_SECRET', 'YOUR_SUPABASE_JWT_SECRET');

class SupabaseClient {
    private $url;
    private $key;
    private $headers;

    public function __construct() {
        $this->url = SUPABASE_URL;
        $this->key = SUPABASE_KEY;
        $this->headers = [
            'apikey: ' . $this->key,
            'Authorization: Bearer ' . $this->key,
            'Content-Type: application/json',
            'Prefer: return=minimal'
        ];
    }

    /**
     * Make a request to Supabase
     */
    private function request($endpoint, $method = 'GET', $data = null) {
        $ch = curl_init($this->url . $endpoint);
        
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $this->headers);
        
        if ($method !== 'GET') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        }
        
        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return [
            'status' => $statusCode,
            'data' => json_decode($response, true)
        ];
    }

    /**
     * Select data from a table
     */
    public function select($table, $query = '*', $options = []) {
        $endpoint = '/rest/v1/' . $table;
        
        // Add query parameters if provided
        if (!empty($options)) {
            $endpoint .= '?' . http_build_query($options);
        }
        
        return $this->request($endpoint);
    }

    /**
     * Insert data into a table
     */
    public function insert($table, $data) {
        $endpoint = '/rest/v1/' . $table;
        return $this->request($endpoint, 'POST', $data);
    }

    /**
     * Update data in a table
     */
    public function update($table, $data, $conditions) {
        $endpoint = '/rest/v1/' . $table;
        $endpoint .= '?' . http_build_query($conditions);
        return $this->request($endpoint, 'PATCH', $data);
    }

    /**
     * Delete data from a table
     */
    public function delete($table, $conditions) {
        $endpoint = '/rest/v1/' . $table;
        $endpoint .= '?' . http_build_query($conditions);
        return $this->request($endpoint, 'DELETE');
    }

    /**
     * Authenticate user
     */
    public function signIn($email, $password) {
        $endpoint = '/auth/v1/token?grant_type=password';
        $data = [
            'email' => $email,
            'password' => $password
        ];
        return $this->request($endpoint, 'POST', $data);
    }

    /**
     * Register new user
     */
    public function signUp($email, $password, $userData = []) {
        $endpoint = '/auth/v1/signup';
        $data = [
            'email' => $email,
            'password' => $password,
            'data' => $userData
        ];
        return $this->request($endpoint, 'POST', $data);
    }
}
