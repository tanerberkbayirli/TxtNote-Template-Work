$w=New-Object -ComObject Word.Application;$w.Visible=$false
try{foreach($f in (Get-ChildItem $PSScriptRoot -Filter *.docx)){$d=$w.Documents.Open($f.FullName,$false,$true);$d.SaveAs2($f.FullName+".pdf",17);$d.Close()}}finally{$w.Quit()}
