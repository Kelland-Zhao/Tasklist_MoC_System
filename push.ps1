param(
    [Parameter(Mandatory=$true)]
    [string]$msg
)

Write-Host ">>> git add ." -ForegroundColor Cyan
git add .

Write-Host ">>> git commit -m `"$msg`"" -ForegroundColor Cyan
git commit -m $msg

Write-Host ">>> clasp push" -ForegroundColor Cyan
clasp push

Write-Host "Done." -ForegroundColor Green
