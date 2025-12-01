# Script PowerShell pour ajouter la route CodeEditorPage
$file = "c:\Users\Orochichrys\Documents\programmation\HebergeRapide\App.tsx"
$content = Get-Content $file -Raw

# Ajouter l'import après UserProfile
$content = $content -replace "import UserProfile from './components/UserProfile';", "import UserProfile from './components/UserProfile';`r`nimport CodeEditorPage from './components/CodeEditorPage';"

# Ajouter la route après la route /profile
$oldRoute = @'
          <Route path="/profile" element={
            user ? <UserProfile user={user} token={token} onUpdateUser={handleUpdateUser} /> : null
          } />

          <Route path="/api-docs" element={
            <ApiDocs />
          } />
'@

$newRoute = @'
          <Route path="/profile" element={
            user ? <UserProfile user={user} token={token} onUpdateUser={handleUpdateUser} /> : null
          } />

          <Route path="/edit/:id" element={
            <CodeEditorPage token={token} />
          } />

          <Route path="/api-docs" element={
            <ApiDocs />
          } />
'@

$content = $content -replace [regex]::Escape($oldRoute), $newRoute

# Sauvegarder
Set-Content -Path $file -Value $content -NoNewline
Write-Host "Route CodeEditorPage ajoutée avec succès!"
