<?php

header('Cache-Control: no-cache, must-revalidate');
header('Content-Type: application/javascript');

echo file_get_contents('reactor-tracker.js');

?>