$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $doc = $word.Documents.Open("c:\Users\ABC\Downloads\25_bai_viet_Phan_4_Phuc_Hoi_Tu_Than.docx")
    $doc.SaveAs("c:\Users\ABC\Downloads\Phan_4.txt", 2)
    $doc.Close()
    
    $doc3 = $word.Documents.Open("c:\Users\ABC\Downloads\25_bai_viet_Phan_3_Quang_Lao_Hoa.docx")
    $doc3.SaveAs("c:\Users\ABC\Downloads\Phan_3.txt", 2)
    $doc3.Close()
}
finally {
    $word.Quit()
}
Write-Output "SUCCESS"
