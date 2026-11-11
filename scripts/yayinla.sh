#!/usr/bin/env bash
# Uygulamayı derleyip TestFlight'a gönderir. Tek komut: npm run yayinla
# Sırasıyla: Expo girişi (gerekirse), projeyi Expo'ya bağlama (gerekirse), iOS derlemesi ve gönderim.
set -e

EAS="npx --yes eas-cli@latest"

if ! $EAS whoami >/dev/null 2>&1; then
  echo "== Expo hesabına giriş =="
  $EAS login
fi

if ! node -e "process.exit(require('./app.json').expo?.extra?.eas?.projectId ? 0 : 1)"; then
  echo "== Proje Expo'ya bağlanıyor =="
  $EAS init
fi

echo "== iOS derlemesi başlıyor (Apple hesabı sorulacak) =="
$EAS build --platform ios --profile production --auto-submit
