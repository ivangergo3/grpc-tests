$ErrorActionPreference = "Stop"

# Proto -> TypeScript generation using:
# - grpc-tools: ships a `protoc` you don't need to install globally
# - ts-proto: generates TS types + grpc-js client/server stubs
#
# Output (`src/gen`) is intended to be committed.

$RootDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ProtoDir = Join-Path $RootDir "proto"
$OutDir = Join-Path $RootDir "src\gen"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$TsProtoPlugin = Join-Path $RootDir "node_modules\.bin\protoc-gen-ts_proto.cmd"
if (!(Test-Path $TsProtoPlugin)) {
  $TsProtoPlugin = Join-Path $RootDir "node_modules\.bin\protoc-gen-ts_proto"
}

$Protoc = Join-Path $RootDir "node_modules\.bin\grpc_tools_node_protoc.cmd"
if (!(Test-Path $Protoc)) {
  $Protoc = Join-Path $RootDir "node_modules\.bin\grpc_tools_node_protoc"
}

if (!(Test-Path $TsProtoPlugin)) {
  throw "ts-proto plugin not found. Run: bun install (or npm install)"
}

if (!(Test-Path $Protoc)) {
  throw "grpc_tools_node_protoc not found. Run: bun install (or npm install)"
}

$ProtoFiles = Get-ChildItem -Path $ProtoDir -Recurse -Filter *.proto | ForEach-Object { $_.FullName }
if ($ProtoFiles.Count -eq 0) {
  throw "No .proto files found under $ProtoDir"
}

Write-Host "Generating TS from protos..." -ForegroundColor Cyan
Write-Host " - proto root: $ProtoDir"
Write-Host " - out dir:    $OutDir"
Write-Host " - files:      $($ProtoFiles.Count)"

& $Protoc `
  -I $ProtoDir `
  --plugin=("protoc-gen-ts_proto=" + $TsProtoPlugin) `
  --ts_proto_out=$OutDir `
  --ts_proto_opt="env=node,esModuleInterop=true,outputServices=grpc-js,useOptionals=messages" `
  $ProtoFiles

Write-Host "Done." -ForegroundColor Green

