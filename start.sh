esbuild ./src/index.ts \
  --platform=node \
  --target=node18 \
  --outdir=build \
  --packages=external \
  --format=esm \
  --minify \
  --bundle


npx functions-framework \
  --source=build \
  --target=trading-bot-proto


