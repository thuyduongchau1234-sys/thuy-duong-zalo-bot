# Convert Part 4 docx to zip and parse XML
$docxPath = "c:\Users\ABC\Downloads\25_bai_viet_Phan_4_Phuc_Hoi_Tu_Than.docx"
$zipPath = "c:\Users\ABC\Downloads\Phan_4.zip"
$destDir = "c:\Users\ABC\Downloads\Phan_4_extracted"

if (Test-Path $destDir) {
    Remove-Item $destDir -Recurse -Force
}

Copy-Item $docxPath $zipPath -Force
Expand-Archive -Path $zipPath -DestinationPath $destDir -Force

[xml]$xml = Get-Content -Path "$destDir\word\document.xml" -Encoding UTF8
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")

# We want to preserve paragraphs.
# In Word XML, paragraphs are represented by <w:p>
$paragraphs = $xml.SelectNodes("//w:p", $ns)
$lines = @()

foreach ($p in $paragraphs) {
    # For each paragraph, find all text runs <w:t>
    $ts = $p.SelectNodes(".//w:t", $ns)
    $pText = ""
    foreach ($t in $ts) {
        $pText += $t.InnerText
    }
    $lines += $pText
}

$fullText = $lines -join "`r`n"
$fullText | Out-File -FilePath "c:\Users\ABC\Downloads\Phan_4_correct.txt" -Encoding utf8

# Clean up
Remove-Item $zipPath -Force
Remove-Item $destDir -Recurse -Force

Write-Output "SUCCESS PARSING PART 4"
