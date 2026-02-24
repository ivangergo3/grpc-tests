$ErrorActionPreference = "Stop"

# Proto -> TypeScript generation using:
# - grpc-tools: ships a `protoc` you don't need to install globally
# - ts-proto: generates TS types + grpc-js client/server stubs
#
# Output (`src/gen`) is intended to be committed.

$RootDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ProtoDir = Join-Path $RootDir "proto"
$OutDir = Join-Path $RootDir "src" "gen"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$TsProtoPlugin = Join-Path $RootDir "node_modules" ".bin" "protoc-gen-ts_proto"
$TsProtoPluginCmd = $TsProtoPlugin + ".cmd"
if (Test-Path $TsProtoPluginCmd) {
  $TsProtoPlugin = $TsProtoPluginCmd
}

$Protoc = Join-Path $RootDir "node_modules" ".bin" "grpc_tools_node_protoc"
$ProtocCmd = $Protoc + ".cmd"
if (Test-Path $ProtocCmd) {
  $Protoc = $ProtocCmd
}

if (!(Test-Path $TsProtoPlugin)) {
  Write-Error "ERROR: ts-proto plugin not found at: $TsProtoPlugin"
  Write-Error "Run: bun install (or npm install)"
  exit 1
}

if (!(Test-Path $Protoc)) {
  Write-Error "ERROR: grpc_tools_node_protoc not found at: $Protoc"
  Write-Error "Run: bun install (or npm install)"
  exit 1
}

$ProtoFiles =
  Get-ChildItem -Path $ProtoDir -Recurse -File -Filter *.proto |
    Sort-Object FullName |
    ForEach-Object { $_.FullName }

if ($ProtoFiles.Count -eq 0) {
  Write-Error "ERROR: no .proto files found under $ProtoDir"
  exit 1
}

Write-Host "Generating TS from protos..." -ForegroundColor Cyan
Write-Host "- proto root: $ProtoDir"
Write-Host "- out dir:    $OutDir"
Write-Host "- files:      $($ProtoFiles.Count)"

& $Protoc `
  -I $ProtoDir `
  --plugin=("protoc-gen-ts_proto=" + $TsProtoPlugin) `
  --ts_proto_out=$OutDir `
  --ts_proto_opt="env=node,esModuleInterop=true,outputServices=grpc-js,useOptionals=messages" `
  $ProtoFiles

Write-Host "Done." -ForegroundColor Green

