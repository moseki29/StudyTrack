$ErrorActionPreference = 'Stop'

$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$rootPrefix = $root.TrimEnd('\') + '\'
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://127.0.0.1:8765/')

try {
  $listener.Start()
} catch {
  Write-Error "Could not start the local app server on port 8765. Close any other app using that port and try again. $($_.Exception.Message)"
  exit 1
}

Write-Host 'Daily Targets is running locally at http://127.0.0.1:8765/'
Write-Host 'Your schedule files stay in your browser; close this window to stop the server.'
Start-Process 'http://127.0.0.1:8765/'

$contentTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.mjs'  = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.wasm' = 'application/wasm'
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    try {
      $relativePath = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
      if ([string]::IsNullOrWhiteSpace($relativePath)) {
        $relativePath = 'index.html'
      }
      $filePath = [System.IO.Path]::GetFullPath((Join-Path $root $relativePath))
      if (-not $filePath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase) -or
          -not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        $context.Response.StatusCode = 404
        $context.Response.Close()
        continue
      }
      $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
      if ($contentTypes.ContainsKey($extension)) {
        $context.Response.ContentType = $contentTypes[$extension]
      } else {
        $context.Response.ContentType = 'application/octet-stream'
      }
      $context.Response.Headers['Cache-Control'] = 'no-store'
      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      $context.Response.ContentLength64 = $bytes.Length
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      $context.Response.Close()
    } catch {
      if ($context.Response.OutputStream.CanWrite) {
        $context.Response.StatusCode = 500
        $context.Response.Close()
      }
      Write-Warning "Could not serve a local file: $($_.Exception.Message)"
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
