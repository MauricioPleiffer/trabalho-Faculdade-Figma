Conectar o repositório ao Figma (exportar imagens de um node)

Este repositório inclui um pequeno script PowerShell para baixar a imagem de um node do Figma usando a API.

Passos rápidos

1) Obter um Personal Access Token no Figma
   - Vá em https://www.figma.com/developers/api
   - Clique em "Personal Access Tokens" e gere um token (guarde em lugar seguro)

2) Obter o File Key e Node ID
   - Abra o arquivo no Figma
   - O File Key é a parte do URL entre "file/" e a próxima "/". Exemplo: https://www.figma.com/file/<FILE_KEY>/Nome
   - Para pegar um Node ID, selecione o elemento no Figma, clique com o botão direito > Copy/Paste > Copy as > Copy/Copy as 'SVG code' ou use a API/inspecionar para extrair o id (normalmente algo como '123:45')

3) Rodar localmente (PowerShell)

# Exemplo usando variáveis de ambiente
$env:FIGMA_TOKEN = "seu_token"
$env:FIGMA_FILE_KEY = "seu_file_key"
$env:FIGMA_NODE_ID = "seu_node_id"
powershell -File .\scripts\download_figma_node.ps1

# Ou passar como parâmetros
powershell -File .\scripts\download_figma_node.ps1 -FigmaToken "seu_token" -FileKey "seu_file_key" -NodeId "seu_node_id" -Output "saida.png"

4) Usar em GitHub Actions
   - Adicione os segredos: FIGMA_TOKEN, FIGMA_FILE_KEY, FIGMA_NODE_ID
   - Veja o workflow de exemplo em .github/workflows/figma-download.yml

Notas
- O script salva a imagem na raiz do repositório com o nome especificado por -Output.
- Formatos suportados pela API: png, jpg, svg
