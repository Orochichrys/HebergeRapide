# Script PowerShell pour modifier App.tsx
$file = "c:\Users\Orochichrys\Documents\programmation\HebergeRapide\App.tsx"
$content = Get-Content $file -Raw

# Modification 1: Signature de handleDeploy
$content = $content -replace 'const handleDeploy = async \(name: string, subdomain: string, code: string\) =>', 'const handleDeploy = async (name: string, subdomain: string, code: string, css?: string, js?: string) =>'

# Modification 2: Body JSON.stringify
$content = $content -replace 'body: JSON\.stringify\(\{ name, html: code \}\)', 'body: JSON.stringify({ name, html: code, css, js })'

# Modification 3: newDeployment object
$old = @'
        const newDeployment: Deployment = {
          id: data.id,
          subdomain: data.subdomain,
          name,
          code,
          createdAt: Date.now(),
          status: data.status,
          url: data.url,
          visitors: 0
        };
'@

$new = @'
        const newDeployment: Deployment = {
          id: data.id,
          subdomain: data.subdomain,
          name,
          code,
          css,
          js,
          createdAt: Date.now(),
          status: data.status,
          url: data.url,
          visitors: 0
        };
'@

$content = $content -replace [regex]::Escape($old), $new

# Sauvegarder
Set-Content -Path $file -Value $content -NoNewline
Write-Host "App.tsx modifié avec succès!"
