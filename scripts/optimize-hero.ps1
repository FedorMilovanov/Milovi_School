# ================================================
# PowerShell скрипт для оптимизации Hero изображений
# Запуск: .\scripts\optimize-hero.ps1
# ================================================

$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Fedor\Downloads\patisserie-russe-FINAL"
$SourceImage = "$ProjectRoot\public\images\premium-hero.jpg"
$OutputDir = "$ProjectRoot\public\images"

# Проверяем, существует ли исходное изображение
if (-not (Test-Path $SourceImage)) {
    Write-Host "❌ Не найдено исходное изображение: $SourceImage" -ForegroundColor Red
    Write-Host "Положи высококачественное hero-изображение в public/images/premium-hero.jpg (рекомендуется минимум 1920x1080)" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Начинаем оптимизацию hero изображений..." -ForegroundColor Cyan

# Создаём директорию, если её нет
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Проверяем Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js найден: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js не найден. Установи Node.js с https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Устанавливаем sharp локально (если ещё не установлен)
$SharpInstalled = Test-Path "$ProjectRoot\node_modules\sharp"
if (-not $SharpInstalled) {
    Write-Host "📦 Устанавливаем sharp..." -ForegroundColor Yellow
    Set-Location $ProjectRoot
    npm install sharp --save-dev
}

# Создаём временный Node.js скрипт
$NodeScript = @"
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const input = process.argv[2];
const outputDir = process.argv[3];

const sizes = [640, 1280, 1920];
const formats = ['avif', 'webp', 'jpg'];

async function generateImages() {
  for (const size of sizes) {
    for (const format of formats) {
      const filename = `hero-${size}.${format}`;
      const outputPath = path.join(outputDir, filename);

      let pipeline = sharp(input)
        .resize(size, null, {
          width: size,
          withoutEnlargement: true,
          fit: 'inside'
        })
        .withMetadata();

      if (format === 'avif') {
        pipeline = pipeline.avif({ quality: 72, effort: 9 });
      } else if (format === 'webp') {
        pipeline = pipeline.webp({ quality: 82, effort: 6 });
      } else {
        pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true });
      }

      await pipeline.toFile(outputPath);
      console.log(`✅ Создано: ${filename}`);
    }
  }
  console.log('\n🎉 Все hero-изображения успешно сгенерированы!');
}

generateImages().catch(console.error);
"@

$TempScript = "$ProjectRoot\scripts\temp-optimize-hero.js"
$NodeScript | Out-File -FilePath $TempScript -Encoding UTF8

# Запускаем генерацию
Write-Host "🖼️  Генерируем hero изображения (640 / 1280 / 1920)..." -ForegroundColor Cyan
node $TempScript $SourceImage $OutputDir

# Удаляем временный скрипт
Remove-Item $TempScript -ErrorAction SilentlyContinue

Write-Host "`n✅ Готово! Изображения сохранены в public/images/" -ForegroundColor Green
Write-Host "Теперь можно запускать: npm run build" -ForegroundColor Cyan