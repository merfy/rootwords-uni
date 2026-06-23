 $url = 'https://blog.csdn.net/liu17234050/article/details/104566377'
 $outfile = 'csdn_article.html'
 $wc = New-Object System.Net.WebClient
 $wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
 try {
     $content = $wc.DownloadString($url)
     Write-Host ('Downloaded: ' + $content.Length + ' chars')
     [System.IO.File]::WriteAllText((Join-Path (Get-Location) $outfile), $content)
     Write-Host 'Saved to csdn_article.html'
 } catch {
     $err = $_.Exception.Message
     Write-Host ('Error: ' + $err)
 }
