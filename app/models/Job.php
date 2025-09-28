<?php
class Job {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function createJob($title, $company, $location, $type, $description, $salary, $user_id) {
        $stmt = $this->conn->prepare("INSERT INTO jobs (title, company, location, type, description, salary, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssssdi", $title, $company, $location, $type, $description, $salary, $user_id);
        return $stmt->execute();
    }

    public function getJobs($filters = []) {
        $query = "SELECT * FROM jobs WHERE 1=1";
        
        if (!empty($filters['keyword'])) {
            $keyword = "%" . $filters['keyword'] . "%";
            $query .= " AND (title LIKE ? OR description LIKE ?)";
        }
        
        if (!empty($filters['location'])) {
            $query .= " AND location = ?";
        }
        
        if (!empty($filters['type'])) {
            $query .= " AND type = ?";
        }
        
        $query .= " ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        
        if (!empty($filters)) {
            // Bind parameters based on filters
            $types = "";
            $params = [];
            
            if (!empty($filters['keyword'])) {
                $types .= "ss";
                array_push($params, $keyword, $keyword);
            }
            if (!empty($filters['location'])) {
                $types .= "s";
                array_push($params, $filters['location']);
            }
            if (!empty($filters['type'])) {
                $types .= "s";
                array_push($params, $filters['type']);
            }
            
            if (!empty($params)) {
                $stmt->bind_param($types, ...$params);
            }
        }
        
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function getJobById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM jobs WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function updateJob($id, $title, $company, $location, $type, $description, $salary) {
        $stmt = $this->conn->prepare("UPDATE jobs SET title=?, company=?, location=?, type=?, description=?, salary=? WHERE id=?");
        $stmt->bind_param("sssssdi", $title, $company, $location, $type, $description, $salary, $id);
        return $stmt->execute();
    }

    public function deleteJob($id) {
        $stmt = $this->conn->prepare("DELETE FROM jobs WHERE id = ?");
        $stmt->bind_param("i", $id);
        return $stmt->execute();
    }
}
