
<?php
function handleUsers($method) {
    global $pdo;
    
    switch($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM users");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            // Handle user creation
            break;
    }
}

function handleSubjects($method) {
    global $pdo;
    
    switch($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM subjects");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;
    }
}
