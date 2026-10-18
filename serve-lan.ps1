$ErrorActionPreference = 'Stop'

$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$rootPrefix = $root.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
$port = 8765
$contentTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.webmanifest' = 'application/manifest+json; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'
  '.mjs' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'
  '.wasm' = 'application/wasm'
  '.png' = 'image/png'
  '.jpg' = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.svg' = 'image/svg+xml; charset=utf-8'
  '.ico' = 'image/x-icon'
}

function Write-HttpResponse {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [string]$Status,
    [string]$ContentType,
    [byte[]]$Body,
    [bool]$HeadOnly = $false
  )
  $length = if ($Body) { $Body.Length } else { 0 }
  $headerText = "HTTP/1.1 $Status`r`nContent-Type: $ContentType`r`nContent-Length: $length`r`nConnection: close`r`nCache-Control: no-store`r`nX-Content-Type-Options: nosniff`r`nReferrer-Policy: same-origin`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerText)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if (-not $HeadOnly -and $Body -and $Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
try {
  $listener.Start(32)
} catch {
  Write-Error "Could not start phone-access server on port $port. Close any other app using that port and try again. $($_.Exception.Message)"
  exit 1
}

$addresses = @(
  [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces() |
    Where-Object { $_.OperationalStatus -eq [System.Net.NetworkInformation.OperationalStatus]::Up } |
    ForEach-Object { $_.GetIPProperties().UnicastAddresses } |
    Where-Object {
      $_.Address.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and
      -not [System.Net.IPAddress]::IsLoopback($_.Address)
    } |
    ForEach-Object { $_.Address.IPAddressToString } |
    Sort-Object -Unique
)

Write-Host "Daily Targets is serving static files on your private network at port $port."
Write-Host 'On the laptop: http://127.0.0.1:8765/'
if ($addresses.Count -gt 0) {
  foreach ($address in $addresses) { Write-Host "On a phone on the same Wi-Fi: http://${address}:$port/" }
} else {
  Write-Warning 'No active private-network IPv4 address was detected. Check Wi-Fi, then restart this script.'
}
Write-Host 'Only the app files are served; each browser keeps its own separate planner and file data.'
Write-Host 'Use a trusted private Wi-Fi network. Close this window to stop phone access.'
try { Start-Process 'http://127.0.0.1:8765/' } catch { Write-Warning 'Could not open a browser automatically. Open http://127.0.0.1:8765/ on this laptop.' }

try {
  while ($listener.Server.IsBound) {
    $client = $null
    $stream = $null
    $reader = $null
    try {
      $client = $listener.AcceptTcpClient()
      $client.ReceiveTimeout = 5000
      $stream = $client.GetStream()
      $stream.ReadTimeout = 5000
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }
      while ($true) {
        $headerLine = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($headerLine)) { break }
      }
      $parts = $requestLine -split ' ', 3
      if ($parts.Length -lt 2) {
        Write-HttpResponse -Stream $stream -Status '400 Bad Request' -ContentType 'text/plain; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes('Bad request.'))
        continue
      }
      $method = $parts[0].ToUpperInvariant()
      $headOnly = $method -eq 'HEAD'
      if ($method -ne 'GET' -and -not $headOnly) {
        Write-HttpResponse -Stream $stream -Status '405 Method Not Allowed' -ContentType 'text/plain; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes('Only GET and HEAD are supported.'))
        continue
      }
      $rawPath = ($parts[1] -split '\?', 2)[0]
      $relativePath = [System.Uri]::UnescapeDataString($rawPath.TrimStart('/'))
      if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = 'index.html' }
      $filePath = [System.IO.Path]::GetFullPath((Join-Path $root $relativePath))
      if (-not $filePath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase) -or
          -not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        Write-HttpResponse -Stream $stream -Status '404 Not Found' -ContentType 'text/plain; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes('Not found.')) -HeadOnly $headOnly
        continue
      }
      $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
      $contentType = if ($contentTypes.ContainsKey($extension)) { $contentTypes[$extension] } else { 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      Write-HttpResponse -Stream $stream -Status '200 OK' -ContentType $contentType -Body $bytes -HeadOnly $headOnly
    } catch {
      Write-Warning "Could not serve a phone request: $($_.Exception.Message)"
    } finally {
      if ($reader) { $reader.Dispose() }
      if ($stream) { $stream.Dispose() }
      if ($client) { $client.Close() }
    }
  }
} finally {
  $listener.Stop()
}
