#!/bin/bash
echo -e "\033[1;34m--- REPORTE DE ESTADO: BLACK LILY ELITE (ACTUALIZADO) ---\033[0m"
echo "Analizando src/index.js..."
echo ""

# 1. Pool de Modelos
echo -e "\033[1;33m1. Pool de Modelos (Capa 2):\033[0m"
MODELS=$(grep -E "callCerebras|callGroq|callGemini|callCloudflare" src/index.js | grep "async function" | cut -d' ' -f3 | cut -d'(' -f1)
if [ -z "$MODELS" ]; then
    echo "❌ ERROR: No se encontraron funciones de modelos."
else
    echo "✅ Modelos detectados en el código:"
    echo "$MODELS" | sed 's/^/  - /'
fi

# 2. Semantic Router
echo -e "\n\033[1;33m2. Semantic Router (Capa 1):\033[0m"
if grep -qiE "intent|classification|env.AI.run" src/index.js; then
    echo "✅ Capa 1 detectada: El sistema analiza la intención antes de responder."
else
    echo "❌ FALTA: No hay Semantic Router."
fi

# 3. Self-Healing
echo -e "\n\033[1;33m3. Self-Healing (Capa 3):\033[0m"
if grep -q "for (const ai of pool)" src/index.js && grep -q "if (respuesta && respuesta.length > 5)" src/index.js; then
    echo "✅ ESTADO: Self-Healing Pro detectado (reintento automático con validación)."
else
    echo "⚠️ ESTADO: Solo reintenta si la red falla (Básico)."
fi

# 4. API Keys Requeridas
echo -e "\n\033[1;33m4. Configuración de Secretos:\033[0m"
KEYS=$(grep "env\." src/index.js | cut -d'.' -f2 | cut -d',' -f1 | cut -d')' -f1 | grep -v "AI" | sort -u)
echo "🔑 El Worker necesita estas llaves en Cloudflare:"
echo "$KEYS" | sed 's/^/  - /'

echo -e "\n\033[1;34m--- FIN DEL REPORTE ---\033[0m"
