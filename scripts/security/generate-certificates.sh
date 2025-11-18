#!/bin/bash
################################################################################
# Script de Generación de Certificados SSL/TLS Autofirmados
# Proyecto: Administración de Redes - Unidad 3
# Descripción: Genera certificados SSL para habilitar HTTPS en la aplicación
################################################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directorio de certificados
SSL_DIR="./infrastructure/nginx/ssl"
CERT_FILE="$SSL_DIR/certificate.crt"
KEY_FILE="$SSL_DIR/private.key"
CSR_FILE="$SSL_DIR/certificate.csr"
CONFIG_FILE="$SSL_DIR/openssl.cnf"

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Generador de Certificados SSL/TLS Autofirmados${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar si OpenSSL está instalado
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ Error: OpenSSL no está instalado${NC}"
    echo -e "${YELLOW}Por favor instala OpenSSL primero${NC}"
    exit 1
fi

# Crear directorio si no existe
mkdir -p "$SSL_DIR"

# Verificar si ya existen certificados
if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    echo -e "${YELLOW}⚠️  Los certificados ya existen en $SSL_DIR${NC}"
    read -p "¿Deseas regenerarlos? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${GREEN}✅ Manteniendo certificados existentes${NC}"
        exit 0
    fi
    echo -e "${YELLOW}🔄 Regenerando certificados...${NC}"
fi

# Solicitar información para el certificado
echo -e "${YELLOW}📝 Ingresa la información para el certificado:${NC}"
echo ""

read -p "País (2 letras, ej: CL): " COUNTRY
COUNTRY=${COUNTRY:-CL}

read -p "Estado/Provincia (ej: Maule): " STATE
STATE=${STATE:-Maule}

read -p "Ciudad (ej: Talca): " CITY
CITY=${CITY:-Talca}

read -p "Organización (ej: Universidad de Talca): " ORG
ORG=${ORG:-Universidad de Talca}

read -p "Unidad (ej: ICC): " OU
OU=${OU:-ICC}

read -p "Nombre común/dominio (ej: localhost): " CN
CN=${CN:-localhost}

read -p "Email: " EMAIL
EMAIL=${EMAIL:-admin@localhost}

echo ""
echo -e "${GREEN}🔧 Configuración del certificado:${NC}"
echo "  País: $COUNTRY"
echo "  Estado: $STATE"
echo "  Ciudad: $CITY"
echo "  Organización: $ORG"
echo "  Unidad: $OU"
echo "  Dominio: $CN"
echo "  Email: $EMAIL"
echo ""

# Crear archivo de configuración OpenSSL
cat > "$CONFIG_FILE" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C = $COUNTRY
ST = $STATE
L = $CITY
O = $ORG
OU = $OU
CN = $CN
emailAddress = $EMAIL

[v3_req]
subjectAltName = @alt_names
keyUsage = keyEncipherment, dataEncipherment, digitalSignature
extendedKeyUsage = serverAuth

[alt_names]
DNS.1 = $CN
DNS.2 = localhost
DNS.3 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

echo -e "${GREEN}🔐 Generando clave privada RSA de 2048 bits...${NC}"
openssl genrsa -out "$KEY_FILE" 2048 2>/dev/null

echo -e "${GREEN}📜 Generando certificado autofirmado válido por 365 días...${NC}"
openssl req -new -x509 -key "$KEY_FILE" -out "$CERT_FILE" -days 365 \
    -config "$CONFIG_FILE" 2>/dev/null

# Establecer permisos seguros
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Certificados generados exitosamente${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}📁 Archivos generados:${NC}"
echo "  🔑 Clave privada: $KEY_FILE"
echo "  📜 Certificado:   $CERT_FILE"
echo "  ⚙️  Configuración: $CONFIG_FILE"
echo ""

# Mostrar información del certificado
echo -e "${GREEN}📋 Información del certificado:${NC}"
openssl x509 -in "$CERT_FILE" -noout -subject -issuer -dates

echo ""
echo -e "${YELLOW}📌 IMPORTANTE:${NC}"
echo "  • Este es un certificado autofirmado para desarrollo/pruebas"
echo "  • Los navegadores mostrarán una advertencia de seguridad"
echo "  • Para producción, usa Let's Encrypt o un CA confiable"
echo "  • La clave privada NUNCA debe compartirse o subirse a Git"
echo ""
echo -e "${GREEN}🚀 Próximos pasos:${NC}"
echo "  1. Reinicia el contenedor nginx: docker-compose restart api-gateway"
echo "  2. Accede a https://localhost"
echo "  3. Acepta la advertencia de seguridad en tu navegador"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
