param(
    [Parameter(Mandatory=$false)][string]$FigmaToken = $env:FIGMA_TOKEN,
    [Parameter(Mandatory=$false)][string]$FileKey = $env:FIGMA_FILE_KEY,
    [Parameter(Mandatory=$false)][string]$NodeId = $env:FIGMA_NODE_ID,
    [Parameter(Mandatory=$false)][string]$Format = "png",
    [Parameter(Mandatory=$false)][string]$Output = "figma-node.png",
    [Parameter(Mandatory=$false)][int]$Scale = 2
)

if (-not $FigmaToken) {
    Write-Error "Falta FIGMA_TOKEN. Defina a variável de ambiente FIGMA_TOKEN ou passe -FigmaToken '...'"
    exit 1
}
if (-not $FileKey) {
    Write-Error "Falta FIGMA_FILE_KEY. Defina a variável de ambiente FIGMA_FILE_KEY ou passe -FileKey '...'"
    exit 1
}
if (-not $NodeId) {
    Write-Error "Falta FIGMA_NODE_ID. Defina a variável de ambiente FIGMA_NODE_ID ou passe -NodeId '...'"
    exit 1
}

Write-Host "Exportando node '$NodeId' do arquivo '$FileKey' (formato $Format, scale $Scale) ..."

$headers = @{ 'X-Figma-Token' = $FigmaToken }
$imagesApi = "https://api.figma.com/v1/images/$FileKey?ids=$NodeId&format=$Format&scale=$Scale"

try {
    $response = Invoke-RestMethod -Uri $imagesApi -Headers $headers -Method Get -ErrorAction Stop
} catch {
    Write-Error "Falha ao chamar a API do Figma: $_"
    exit 1
}

$url = $null
if ($response -and $response.images -and $response.images.$NodeId) {
    $url = $response.images.$NodeId
}

if (-not $url) {
    Write-Error "Não foi possível obter URL da imagem para o node '$NodeId'. Verifique o file key, node id e o token."
    exit 1
}

Write-Host "URL encontrada: $url"

try {
    Invoke-WebRequest -Uri $url -OutFile $Output -UseBasicParsing -ErrorAction Stop
    Write-Host "Salvo em: $Output"
} catch {
    Write-Error "Falha ao baixar a imagem: $_"
    exit 1
}
