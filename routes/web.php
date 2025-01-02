
<?php
function route($request, $method) {
    switch ($request) {
        case '/':
            require 'views/login.php';
            break;
        case '/dashboard':
            require 'views/dashboard.php';
            break;
        default:
            http_response_code(404);
            require 'views/404.php';
            break;
    }
}
