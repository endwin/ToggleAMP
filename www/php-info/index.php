<?php
echo "<!DOCTYPE html><html><head><title>nobreak Multi-Stack Info</title><style>body{font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:3rem;line-height:1.6}h1{color:#38bdf8}.box{background:#1e293b;padding:1.5rem;border-radius:0.75rem;border:1px solid #334155;max-width:600px}</style></head><body>";
echo "<div class='box'>";
echo "<h1>⚡ nobreak Multi-Stack Live Info</h1>";
echo "<p><strong>PHP Version:</strong> " . phpversion() . "</p>";
echo "<p><strong>Server Software:</strong> " . ($_SERVER['SERVER_SOFTWARE'] ?? 'FastCGI Server') . "</p>";
echo "<p><strong>Document Root:</strong> " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
echo "<p><strong>Remote Addr:</strong> " . $_SERVER['REMOTE_ADDR'] . "</p>";
echo "</div>";
echo "</body></html>";
