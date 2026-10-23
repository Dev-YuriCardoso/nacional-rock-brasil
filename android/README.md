# Nacional Rock Brasil para Android

Este projeto gera um aplicativo Android que abre a versão web publicada em:

https://nacional-rock-brasil-bd9s.vercel.app/

## Características
- Nome e ícone próprios.
- WebView com JavaScript, armazenamento local e cookies para autenticação.
- Suporte ao seletor de arquivos, usado em uploads.
- Tratamento de botão Voltar e página amigável quando não há conexão.
- HTTPS obrigatório.

O app precisa de conexão com a internet para carregar o site e acessar o Supabase. O APK de teste é assinado com a chave de debug do Android; para publicação na Play Store é necessário criar/usar uma chave de assinatura de release própria.

O workflow GitHub Actions `.github/workflows/build-android-apk.yml` gera o APK de debug e publica o arquivo como artefato para download.
