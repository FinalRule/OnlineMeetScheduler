
<?php
session_start();
require_once 'config/database.php';
require_once 'routes/web.php';

$request = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

route($request, $method);
