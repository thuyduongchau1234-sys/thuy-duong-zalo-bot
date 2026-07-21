$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $doc = $word.Documents.Open("c:\Users\ABC\Downloads\25_bai_viet_Phan_4_Phuc_Hoi_Tu_Than.docx")
    $text = $doc.Content.Text
    $text | Out-File -FilePath "c:\Users\ABC\Downloads\Phan_4_utf8.txt" -Encoding utf8
    $doc.Close()
    
    $doc3 = $word.Documents.Open("c:\Users\ABC\Downloads\25_bai_viet_Phan_3_Quang_Lao_Hoa.docx")
    $text3 = $doc3.Content.Text
    $text3 | Out-File -FilePath "c:\Users\ABC\Downloads\Phan_3_utf8.txt" -Encoding utf8
    $doc3.Close()
}
finally {
    $word.Quit()
}
Write-Output "SUCCESS UTF8"
