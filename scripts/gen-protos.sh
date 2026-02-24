#!/usr/bin/env bash
set -euo pipefail

# Proto -> TypeScript generation using:
# - grpc-tools: ships a `protoc` you don't need to install globally
# - ts-proto: generates TS types + grpc-js client/server stubs
#
# Runs on:
# - Windows Git Bash
# - Linux/macOS bash (including macOS' default Bash 3.x)
#
# Output (`src/gen`) is intended to be committed.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROTO_DIR="$ROOT_DIR/proto"
OUT_DIR="$ROOT_DIR/src/gen"

mkdir -p "$OUT_DIR"

TS_PROTO_PLUGIN="$ROOT_DIR/node_modules/.bin/protoc-gen-ts_proto"
# If Windows, use the .cmd file instead
if [ -f "$ROOT_DIR/node_modules/.bin/protoc-gen-ts_proto.cmd" ]; then
  TS_PROTO_PLUGIN="$ROOT_DIR/node_modules/.bin/protoc-gen-ts_proto.cmd"
fi

PROTOC="$ROOT_DIR/node_modules/.bin/grpc_tools_node_protoc"
# If Windows, use the .cmd file instead
if [ -f "$ROOT_DIR/node_modules/.bin/grpc_tools_node_protoc.cmd" ]; then
  PROTOC="$ROOT_DIR/node_modules/.bin/grpc_tools_node_protoc.cmd"
fi

if [ ! -e "$TS_PROTO_PLUGIN" ]; then
  echo "ERROR: ts-proto plugin not found at: $TS_PROTO_PLUGIN" >&2
  echo "Run: bun install (or npm install)" >&2
  exit 1
fi

if [ ! -e "$PROTOC" ]; then
  echo "ERROR: grpc_tools_node_protoc not found at: $PROTOC" >&2
  echo "Run: bun install (or npm install)" >&2
  exit 1
fi

PROTO_FILES=()
while IFS= read -r f; do
  PROTO_FILES+=("$f")
done < <(find "$PROTO_DIR" -type f -name "*.proto" | sort)

if [ ${#PROTO_FILES[@]} -eq 0 ]; then
  echo "ERROR: no .proto files found under $PROTO_DIR" >&2
  exit 1
fi

echo "Generating TS from protos..."
echo "- proto root: $PROTO_DIR"
echo "- out dir:    $OUT_DIR"
echo "- files:      ${#PROTO_FILES[@]}"

"$PROTOC" \
  -I "$PROTO_DIR" \
  --plugin="protoc-gen-ts_proto=$TS_PROTO_PLUGIN" \
  --ts_proto_out="$OUT_DIR" \
  --ts_proto_opt="env=node,esModuleInterop=true,outputServices=grpc-js,useOptionals=messages" \
  "${PROTO_FILES[@]}"

echo "Done."

