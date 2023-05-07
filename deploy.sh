#!/usr/bin/bash

esbuild ./src/index.ts \
  --platform=node \
  --target=node18 \
  --outdir=build \
  --packages=external \
  --format=esm \
  --minify \
  --bundle

cp deploy.package.json ./build/package.json

gcloud functions deploy trading-bot-proto \
  --runtime=nodejs18 \
  --source=build \
  --region=asia-northeast1 \
  --memory=128MB \
  --trigger-http \
  --allow-unauthenticated
