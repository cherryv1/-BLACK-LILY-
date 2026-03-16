#!/bin/bash

echo "🔍 AUDITORÍA DE ENTORNO: BLACK LILY ELITE v2.0"
echo "--------------------------------------------"

# 1. Verificar Archivos Críticos
echo "📁 Verificando archivos del repositorio:"
files=("src/index.js" "wrangler.toml" "package.json" "schema.sql")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file: EXISTE"
    else
        echo "  ❌ $file: NO EXISTE"
    fi
done

# 2. Verificar Herramientas
echo -e "\n🛠️ Verificando herramientas instaladas:"
command -v node >/dev/null 2>&1 && echo "  ✅ Node.js: INSTALADO" || echo "  ❌ Node.js: NO ENCONTRADO"
command -v wrangler >/dev/null 2>&1 && echo "  ✅ Wrangler: INSTALADO" || echo "  ❌ Wrangler: NO ENCONTRADO"
command -v git >/dev/null 2>&1 && echo "  ✅ Git: INSTALADO" || echo "  ❌ Git: NO ENCONTRADO"

# 3. Verificar Configuración de Wrangler (D1 y KV)
echo -e "\n⚙️ Verificando configuración en wrangler.toml:"
if [ -f "wrangler.toml" ]; then
    grep -q "d1_databases" wrangler.toml && echo "  ✅ D1 Configurado" || echo "  ❌ D1 NO Configurado"
    grep -q "kv_namespaces" wrangler.toml && echo "  ✅ KV Configurado" || echo "  ❌ KV NO Configurado"
    
    # Buscar placeholders
    if grep -q "<YOUR_D1_DATABASE_ID>" wrangler.toml || grep -q "<YOUR_KV_NAMESPACE_ID>" wrangler.toml; then
        echo "  ⚠️ ADVERTENCIA: Aún tienes placeholders (<YOUR_...>) en wrangler.toml"
    fi
else
    echo "  ❌ wrangler.toml no encontrado para auditar."
fi

# 4. Recordatorio de Secretos Faltantes (GitHub)
echo -e "\n🔐 Recordatorio de Secretos (Debes configurarlos en GitHub):"
echo "  ⚠️ FALTAN (según tu mensaje):"
echo "    - WHATSAPP_VERIFY_TOKEN"
echo "    - INSTAGRAM_VERIFY_TOKEN"
echo "    - GOOGLE_CALENDAR_API_KEY (Opcional)"
echo "  ✅ YA TIENES (asumido):"
echo "    - CF_API_TOKEN / CF_ACCOUNT_ID"
echo "    - GEMINI_API_KEY / GROQ_API_KEY / CEREBRAS_API_KEY"

echo "--------------------------------------------"
echo "💡 Ejecuta este script con: bash auditoria_black_lily.sh"
