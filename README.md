<p align="center">
  <img src="docs/public/logo.svg" alt="Logo do projeto" width="300">
</p>

# Jelly Notify

Bot para receber notificações do Jellyfin e enviá-las para contatos do WhatsApp.

## Visão geral

- recebe webhooks do Jellyfin;
- valida um token secreto;
- envia mensagens para os destinatários configurados;
- ignora duplicatas em um intervalo configurável;
- conecta a conta do WhatsApp Web usando [whatsapp-web.js](https://github.com/wwebjs/whatsapp-web.js) e autenticação por QR code.

## Requisitos

- Node.js 24+
- Chromium/Puppeteer compatível
- Jellyfin com o plugin `Webhook`

## Instalação

```bash
git clone https://github.com/wagchi22/jelly-notify.git
cd jelly-notify
npm install
```

## Configuração

1. Gere o arquivo `.env`:

```bash
node bin/jelly-notify.js init
# ou, após instalar o pacote localmente:
jelly-notify init
```

2. Ajuste os valores em `.env`:

```env
PORT=3000
API_TOKEN=troque-por-um-token-secreto
WA_RECIPIENTS=15550100101,15550100102
WA_SELF_NUMBER=
WA_DEDUPE_WINDOW_SECONDS=300
WA_AUTH_TIMEOUT_MS=120000
```

- `API_TOKEN`: token usado para autenticar requisições.
- `WA_RECIPIENTS`: números no formato E.164 sem `+`.
- `WA_SELF_NUMBER`: use apenas quando um destinatário for o próprio número da conta conectada.
- `WA_DEDUPE_WINDOW_SECONDS`: intervalo para ignorar eventos repetidos; use `0` para desativar.
- `WA_AUTH_TIMEOUT_MS`: tempo máximo para conectar ao WhatsApp, em milissegundos (padrão `120000`).

## Execução

```bash
npm start
```

Acesse `http://localhost:3000/qr` para ver o QR code. A API também expõe o endpoint `GET /health` para verificar se a sessão do WhatsApp já está pronta.

## Docker Compose

Configure o arquivo `.env` como descrito acima e inicie o serviço:

```bash
docker compose pull jelly-notify
docker compose up -d jelly-notify
```

O QR code não aparece nos logs; abra `http://localhost:3000/qr` para visualizá-lo no navegador. A sessão e o cache do WhatsApp ficam no volume Docker `jelly-notify`, e o serviço pode ser parado com `docker compose down` sem remover esses dados.

No Windows, também é possível iniciar com:

```powershell
.\jelly-notify.bat
node .\src\index.js
```

## Integração com o Jellyfin

Configure o webhook do Jellyfin para enviar requisições `POST` para:

```text
http://<host-da-api>:3000/api/notifications
```

Se o Jellyfin estiver em um contêiner Docker no Windows com Docker Desktop e o jelly-notify estiver publicando a porta `3000` no host, use:

```text
http://host.docker.internal:3000/api/notifications
```

Dentro do contêiner Jellyfin, `localhost` aponta para o próprio Jellyfin, não para o jelly-notify. Se os dois contêineres estiverem conectados à mesma rede Docker, também é possível usar o nome do serviço ou contêiner do jelly-notify, por exemplo `http://jelly-notify:3000/api/notifications`.

Exemplo de payload com token e mensagem:

```json
{
  "apiToken": "<API_TOKEN>",
  "notificationType": "{{json_encode NotificationType}}",
  "itemId": "{{json_encode ItemId}}",
  "message": "Jellyfin: {{#if_equals ItemType 'Episode'}}*{{json_encode SeriesName}} - {{json_encode Name}}*{{else}}*{{json_encode Name}}{{#if_exist Year}} ({{json_encode Year}}){{/if_exist}}*{{/if_equals}} {{#if_equals NotificationType 'ItemRemoved'}}saiu do catálogo{{else}}entrou no catálogo{{/if_equals}}"
}
```

Também é possível enviar um payload simples:

```json
{
  "message": "Teste de notificação do Jellyfin"
}
```

Para autenticar via cabeçalho, use `X-API-Key` com o mesmo valor de `API_TOKEN`.

Exemplo de teste:

```powershell
Invoke-RestMethod `
  -Uri http://localhost:3000/api/notifications `
  -Method Post `
  -Headers @{ "X-API-Key" = "<API_TOKEN>" } `
  -ContentType "application/json" `
  -Body '{"message":"Teste de notificação do Jellyfin"}'
```

## Observações importantes

- Use um endereço alcançável a partir do ambiente onde o Jellyfin está rodando. `localhost` só funciona quando a API está acessível no mesmo namespace de rede; dentro de um contêiner, refere-se ao próprio contêiner.
- Se a API ficar exposta fora da rede local, proteja-a com autenticação e use HTTPS.
- A API responde com `503` enquanto o WhatsApp estiver desconectado ou reconectando, `400` para payload inválido e `502` em falhas no envio para algum destinatário.
- O campo `recipient` pode ser usado para enviar a mensagem apenas para um número específico já configurado.

## Testes

```bash
npm test
```

## Licença

Este projeto está sob a licença [MIT](./LICENSE).
