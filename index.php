
<?php
session_start();

require_once 'config/database.php';
require_once 'routes/auth.php';
require_once 'routes/api.php';

$request = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Router
switch ($request) {
    case '/':
        require 'views/index.php';
        break;
    case '/api/users':
        handleUsers($method);
        break;
    case '/api/subjects':
        handleSubjects($method);
        break;
    case '/api/classes':
        handleClasses($method);
        break;
    default:
        http_response_code(404);
        require 'views/404.php';
        break;
}
