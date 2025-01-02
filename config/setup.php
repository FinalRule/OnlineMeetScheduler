
<?php
require_once 'database.php';

try {
    // Create users table
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'teacher', 'student') DEFAULT 'student',
        name VARCHAR(255) NOT NULL,
        date_of_birth DATE,
        nationality VARCHAR(100),
        location VARCHAR(255),
        balance DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true
    )");

    // Create subjects table
    $pdo->exec("CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sessions_per_week INT NOT NULL,
        price_per_hour DECIMAL(10,2) NOT NULL,
        is_active BOOLEAN DEFAULT true
    )");

    // Create classes table
    $pdo->exec("CREATE TABLE IF NOT EXISTS classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_id INT,
        teacher_id INT,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        duration INT NOT NULL,
        status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
        FOREIGN KEY (subject_id) REFERENCES subjects(id),
        FOREIGN KEY (teacher_id) REFERENCES users(id)
    )");

    echo "Database tables created successfully";
} catch(PDOException $e) {
    echo "Error creating tables: " . $e->getMessage();
}
?>
