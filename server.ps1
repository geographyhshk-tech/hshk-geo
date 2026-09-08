# Doc cau hinh tu file .env neu ton tai
$envFile = Join-Path $PSScriptRoot ".env"
$envMap = @{}
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $key = $parts[0].Trim()
            $val = $parts[1].Trim()
            $envMap[$key] = $val
        }
    }
}

$port = if ($envMap.ContainsKey("PORT")) { [int]$envMap["PORT"] } else { 3000 }
$nodeEnv = if ($envMap.ContainsKey("NODE_ENV")) { $envMap["NODE_ENV"] } else { "development" }
$geminiApiKey = if ($envMap.ContainsKey("GEMINI_API_KEY")) { $envMap["GEMINI_API_KEY"] } else { "" }
$geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Server running at http://localhost:$port/ [Environment: $nodeEnv]"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # CORS Headers
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 204
            $response.OutputStream.Close()
            continue
        }

        $localPath = $request.Url.LocalPath

        # --- API GATEWAY: Health Check ---
        if ($localPath -eq "/api/health" -and $request.HttpMethod -eq "GET") {
            $resObj = @{
                status = "healthy"
                service = "Geography Edu Backend Gateway (PS1)"
                environment = $nodeEnv
                timestamp = (Get-Date).ToString("o")
                version = "2.0.0"
            }
            $jsonStr = $resObj | ConvertTo-Json -Compress
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonStr)
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.OutputStream.Close()
            continue
        }

        # --- API GATEWAY: AI Chat Proxy ---
        if ($localPath -eq "/api/ai/chat" -and $request.HttpMethod -eq "POST") {
            $bodyStream = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
            $bodyText = $bodyStream.ReadToEnd()
            $bodyObj = if ($bodyText) { $bodyText | ConvertFrom-Json } else { @{} }

            if (-not $geminiApiKey) {
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes('{"error":"GEMINI_API_KEY chua duoc cau hinh tren may chu."}')
                $response.StatusCode = 500
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $errBytes.Length
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                $response.OutputStream.Close()
                continue
            }

            try {
                $apiUrl = "$geminiUrl`?key=$geminiApiKey"
                $geminiPayload = @{
                    contents = if ($bodyObj.contents) { $bodyObj.contents } else { @(@{ parts = @(@{ text = $bodyObj.prompt }) }) }
                    generationConfig = @{
                        temperature = 0.35
                        maxOutputTokens = 1500
                    }
                }
                if ($bodyObj.systemInstruction) {
                    $geminiPayload["systemInstruction"] = @{ parts = @(@{ text = $bodyObj.systemInstruction }) }
                }

                $payloadJson = $geminiPayload | ConvertTo-Json -Depth 10
                $rawRes = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $payloadJson -ContentType "application/json; charset=utf-8"
                $outJson = $rawRes | ConvertTo-Json -Depth 10 -Compress
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($outJson)
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $errMsg = $_.Exception.Message
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes(($(@{ error = $errMsg } | ConvertTo-Json -Compress)))
                $response.StatusCode = 500
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $errBytes.Length
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            }
            $response.OutputStream.Close()
            continue
        }

        # --- API GATEWAY: AI Translate Proxy ---
        if ($localPath -eq "/api/ai/translate" -and $request.HttpMethod -eq "POST") {
            $bodyStream = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
            $bodyText = $bodyStream.ReadToEnd()
            $bodyObj = if ($bodyText) { $bodyText | ConvertFrom-Json } else { @{} }

            $textToTranslate = $bodyObj.text
            $targetLang = $bodyObj.targetLang

            if (-not $textToTranslate -or -not $targetLang) {
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Thieu noi dung can dich hoac ngon ngu dich."}')
                $response.StatusCode = 400
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $errBytes.Length
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                $response.OutputStream.Close()
                continue
            }

            try {
                $prompt = "Translate the following Geography study material text into language '$targetLang'. Return ONLY the direct translation accurately with standard educational geography terminology, without any notes or emojis:`n`n$textToTranslate"
                $geminiPayload = @{
                    contents = @(@{ parts = @(@{ text = $prompt }) })
                    generationConfig = @{ temperature = 0.2; maxOutputTokens = 1000 }
                }
                $apiUrl = "$geminiUrl`?key=$geminiApiKey"
                $payloadJson = $geminiPayload | ConvertTo-Json -Depth 5
                $rawRes = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $payloadJson -ContentType "application/json; charset=utf-8"
                $translated = $rawRes.candidates[0].content.parts[0].text
                $outJson = @{ translatedText = $translated; targetLang = $targetLang } | ConvertTo-Json -Compress
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($outJson)
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $errMsg = $_.Exception.Message
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes(($(@{ error = $errMsg } | ConvertTo-Json -Compress)))
                $response.StatusCode = 500
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $errBytes.Length
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            }
            $response.OutputStream.Close()
            continue
        }

        # --- STATIC FILE SERVING ---
        if ($localPath -eq "/" -or [string]::IsNullOrWhiteSpace($localPath)) {
            $localPath = "/index.html"
        }

        $filePath = Join-Path $PSScriptRoot $localPath.TrimStart('/')
        
        # Security: Block sensitive and hidden files (.env, .rules, .ps1, package.json, server.js, etc.)
        $fileName = (Split-Path $filePath -Leaf).ToLower()
        if ($fileName.StartsWith(".") -or $fileName.EndsWith(".rules") -or $fileName.EndsWith(".ps1") -or $fileName -eq "package.json" -or $fileName -eq "package-lock.json" -or $fileName -eq "server.js") {
            $response.StatusCode = 403
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden")
            $response.ContentType = "text/plain; charset=utf-8"
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.OutputStream.Close()
            continue
        }

        if (Test-Path $filePath) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            if ($filePath.EndsWith(".html")) {
                $response.ContentType = "text/html; charset=utf-8"
            } elseif ($filePath.EndsWith(".css")) {
                $response.ContentType = "text/css; charset=utf-8"
            } elseif ($filePath.EndsWith(".js")) {
                $response.ContentType = "application/javascript; charset=utf-8"
            } elseif ($filePath.EndsWith(".png")) {
                $response.ContentType = "image/png"
            } elseif ($filePath.EndsWith(".jpg") -or $filePath.EndsWith(".jpeg")) {
                $response.ContentType = "image/jpeg"
            } elseif ($filePath.EndsWith(".svg")) {
                $response.ContentType = "image/svg+xml"
            } elseif ($filePath.EndsWith(".webp")) {
                $response.ContentType = "image/webp"
            } elseif ($filePath.EndsWith(".ico")) {
                $response.ContentType = "image/x-icon"
            } elseif ($filePath.EndsWith(".json")) {
                $response.ContentType = "application/json; charset=utf-8"
            } elseif ($filePath.EndsWith(".pdf")) {
                $response.ContentType = "application/pdf"
            }
            $response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")
            $response.AddHeader("Pragma", "no-cache")
            $response.AddHeader("Expires", "0")
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.OutputStream.Close()
    } catch {
        # continue loop
    }
}
