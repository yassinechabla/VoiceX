#!/bin/bash

# Generate self-signed certificates for HTTPS development
# Usage: ./scripts/generate-certs.sh

CERT_DIR="$(dirname "$0")/../certs"
mkdir -p "$CERT_DIR"

openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/cert.pem" \
  -days 365 \
  -subj "/C=FR/ST=Paris/L=Paris/O=Restaurant/CN=localhost"

echo "Certificates generated in $CERT_DIR/"
echo "cert.pem: $CERT_DIR/cert.pem"
echo "privkey.pem: $CERT_DIR/privkey.pem"

