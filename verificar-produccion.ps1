# ====================================
# Script de Verificación Pre-Producción
# ====================================

Write-Host "`n🔍 VERIFICACIÓN PRE-PRODUCCIÓN - EyTaxi Web`n" -ForegroundColor Cyan

# 1. Verificar .env.local
Write-Host "1. Variables de Entorno:" -ForegroundColor Yellow
if (Test-Path .env.local) {
    Write-Host "   ✅ .env.local existe" -ForegroundColor Green
    Write-Host "   ⚠️  Verifica que tiene valores de producción" -ForegroundColor Yellow
} else {
    Write-Host "   ❌ .env.local NO existe" -ForegroundColor Red
    Write-Host "   → Crea .env.local desde .env.example" -ForegroundColor Yellow
}

# 2. Verificar node_modules
Write-Host "`n2. Dependencias:" -ForegroundColor Yellow
if (Test-Path node_modules) {
    Write-Host "   ✅ node_modules existe" -ForegroundColor Green
} else {
    Write-Host "   ❌ node_modules NO existe" -ForegroundColor Red
    Write-Host "   → Ejecuta: npm install" -ForegroundColor Yellow
}

# 3. Verificar archivos críticos
Write-Host "`n3. Archivos Críticos:" -ForegroundColor Yellow
$criticalFiles = @(
    "package.json",
    "next.config.js",
    "tsconfig.json",
    "src/lib/supabase.ts",
    "database/materialized_views.sql"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file FALTA" -ForegroundColor Red
    }
}

# 4. Verificar gitignore
Write-Host "`n4. Archivos Ignorados (.gitignore):" -ForegroundColor Yellow
$ignoredFiles = @(".env.local", "node_modules", ".next", "coverage")
foreach ($file in $ignoredFiles) {
    if (Select-String -Path .gitignore -Pattern $file -Quiet) {
        Write-Host "   ✅ $file en .gitignore" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $file NO está en .gitignore" -ForegroundColor Yellow
    }
}

# 5. Intentar build
Write-Host "`n5. Build de Producción:" -ForegroundColor Yellow
Write-Host "   ⏳ Ejecutando npm run build..." -ForegroundColor Cyan

try {
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Build exitoso" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Build falló" -ForegroundColor Red
        Write-Host "   → Revisa los errores arriba" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Error al ejecutar build" -ForegroundColor Red
}

# 6. Verificar TypeScript
Write-Host "`n6. Verificación de TypeScript:" -ForegroundColor Yellow
try {
    $tscOutput = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Sin errores de TypeScript" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Hay errores/warnings de TypeScript" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  No se pudo verificar TypeScript" -ForegroundColor Yellow
}

# 7. Archivos sensibles
Write-Host "`n7. Archivos Sensibles:" -ForegroundColor Yellow
$sensitiveFiles = @("git_commit.bat", ".env.local")
foreach ($file in $sensitiveFiles) {
    $inGit = git ls-files $file 2>$null
    if ($inGit) {
        Write-Host "   ❌ $file está en Git (¡NO debería!)" -ForegroundColor Red
        Write-Host "   → Ejecuta: git rm --cached $file" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ $file NO está en Git" -ForegroundColor Green
    }
}

# Resumen
Write-Host "`n" -NoNewline
Write-Host "=" -NoNewline -ForegroundColor Cyan
for ($i=0; $i -lt 50; $i++) { Write-Host "=" -NoNewline -ForegroundColor Cyan }
Write-Host "`n📋 RESUMEN:" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
for ($i=0; $i -lt 50; $i++) { Write-Host "=" -NoNewline -ForegroundColor Cyan }
Write-Host "`n"

Write-Host "Revisa el checklist completo en: PRODUCCION_CHECKLIST.md" -ForegroundColor Yellow
Write-Host "`nPróximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Corregir cualquier ❌ o ⚠️  de arriba" -ForegroundColor White
Write-Host "  2. Ejecutar script SQL en Supabase (database/materialized_views.sql)" -ForegroundColor White
Write-Host "  3. Configurar variables de entorno en el servidor de producción" -ForegroundColor White
Write-Host "  4. Deploy con Vercel/Netlify o servidor propio" -ForegroundColor White
Write-Host "`n✨ ¡Listo para producción!`n" -ForegroundColor Green
