# Sistema Clínico Ortogotardo

Aplicação clínica estática para GitHub Pages, com autenticação Google e Google Apps Script como backend. O Apps Script grava pacientes e atendimentos em uma planilha, mantém histórico de versões e gera PDFs no Drive da conta administrativa.

## O que já está implementado

- três perguntas de direcionamento dos últimos 30 dias: sinais de DTM abrem a ficha de DTM, relato de bruxismo abre o STAB e respostas positivas em ambos abrem o caminho combinado;
- caminho combinado inteligente: mantém o DC/TMD completo e apresenta o STAB sem repetir dor, modificadores, cefaleia, ruídos e travamentos já registrados;
- anamnese com até três queixas e campos condicionais para queixas dolorosas;
- questionário de sintomas DC/TMD e itens 1–4 da GCPS v2, com cálculo da intensidade característica da dor;
- STAB de autorrelato e avaliação clínica, sem A7, A8, A9 e PHQ-4, que será preenchido separadamente na sala de espera, e sem pontuação global;
- mapa de dor clicável, com imagem original e marcações transportadas para o PDF;
- um único exame físico, nos modos DTM, bruxismo ou combinado, com intensidade da dor à palpação entre 0 e 3;
- registro profissional de diagnóstico de DTM, avaliação de bruxismo, procedimentos e plano;
- ficha de retorno no mesmo sistema;
- login Google, lista de e-mails autorizados, acesso por vínculo com o paciente e bloqueio de edição simultânea por atendimento;
- rascunhos retomáveis, versões preservadas, correção de um atendimento finalizado e trilha de auditoria;
- PDFs detalhados em formato de tabela, mostrando somente os campos pertinentes no resumo inicial e todo o conteúdo registrado no retorno.

## Estrutura de dados

`setupSystem()` cria a pasta **Sistema Clínico Ortogotardo**, a planilha **Base clínica Ortogotardo** e as abas:

- `Pacientes`
- `Atendimentos`
- `Respostas`
- `Resultados`
- `Usuários`
- `Auditoria`

Não compartilhe a planilha central com todos os alunos. O Google Sheets não oferece permissão por linha; isso permitiria que um aluno visse pacientes de outros grupos. O acesso individual deve ocorrer pelo site e pelas pastas de pacientes vinculados, compartilhadas como somente leitura depois da finalização.

## 1. Preparar a conta Google

Use a conta proprietária `juliana.dentista@gmail.com`, com verificação em duas etapas e recuperação segura. Não coloque senha, códigos de verificação ou chaves privadas no código ou no GitHub. A pasta administrativa pode ser compartilhada com outro e-mail de confiança, mantendo o acesso dos alunos restrito às pastas dos pacientes aos quais foram vinculados.

1. Na conta proprietária, crie um projeto independente no [Google Apps Script](https://script.google.com/).
2. Copie `apps-script/Code.gs` para o arquivo `Code.gs` do projeto.
3. Em **Configurações do projeto**, ative a exibição do manifesto e substitua `appsscript.json` pelo conteúdo de `apps-script/appsscript.json`.
4. Execute `setupSystem()` uma vez e autorize o acesso da conta proprietária ao Drive, Docs, Sheets e chamadas externas.
5. Anote os IDs retornados pela função. Eles também ficam nas propriedades `ROOT_FOLDER_ID` e `SPREADSHEET_ID`.

## 2. Criar o login Google

1. Na mesma conta, crie ou selecione um projeto no [Google Cloud Console](https://console.cloud.google.com/).
2. Configure a tela de consentimento para público **Externo**. O site usa somente identidade básica (`openid`, e-mail e perfil); os alunos não autorizam acesso ao Drive deles.
3. Crie um **Cliente OAuth 2.0** do tipo **Aplicativo da Web**.
4. Em **Origens JavaScript autorizadas**, cadastre:
   - `http://localhost:3000` para teste local;
   - a origem final do GitHub Pages, por exemplo `https://SEU-USUARIO.github.io`.
5. Copie o Client ID, com final `.apps.googleusercontent.com`.

O Google orienta cadastrar apenas esquema e host nas origens autorizadas, sem caminho. Para o grupo previsto de aproximadamente 16 usuários, mantenha também a lista interna de autorização do próprio sistema; estar logado no Google não basta para acessar dados clínicos.

## 3. Configurar o Apps Script

Em **Configurações do projeto → Propriedades do script**, crie:

| Propriedade | Valor |
|---|---|
| `GOOGLE_CLIENT_ID` | Client ID criado na etapa anterior |
| `ALLOWED_ORIGINS` | origens separadas por vírgula, por exemplo `http://localhost:3000,https://SEU-USUARIO.github.io` |
| `ORTOGOTARDO_LOGO_FILE_ID` | opcional: ID do PNG da Ortogotardo enviado ao Drive da conta proprietária |
| `JULIANA_LOGO_FILE_ID` | opcional: ID do PNG Juliana Stuginski enviado ao Drive da conta proprietária |

Cadastre cada participante executando no editor:

```javascript
addAuthorizedUser('aluno@gmail.com', 'Nome do aluno', 'aluno');
addAuthorizedUser('professora@gmail.com', 'Nome da professora', 'professora');
```

Papéis aceitos: `aluno`, `professora`, `coordenacao` e `admin`.

Para o teste inicial, a função `addTestStudents()` cadastra `justuba@gmail.com` e `recestuba@gmail.com` como alunos de teste. Remova ou desative esses acessos quando a validação terminar, caso não sejam contas que permanecerão no curso.

Depois selecione **Implantar → Nova implantação → Aplicativo da Web**:

- executar como: **você**, a conta proprietária;
- quem pode acessar: **qualquer pessoa**;
- copie a URL terminada em `/exec`.

O endpoint precisa aceitar a requisição sem abrir a tela do Apps Script, mas nenhuma operação clínica é liberada anonimamente: cada chamada valida no servidor o token de identidade Google, o Client ID, a validade do token e a aba `Usuários`.

## 4. Publicar no GitHub Pages

1. Crie um repositório privado ou público e envie o conteúdo desta pasta para a raiz do repositório.
2. Em **Settings → Secrets and variables → Actions → Variables**, crie:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_APPS_SCRIPT_URL`
3. Em **Settings → Pages**, selecione **GitHub Actions** como fonte.
4. Faça push na branch `main`. O workflow `.github/workflows/deploy-pages.yml` compila e publica o site.
5. Cadastre a origem definitiva do Pages no OAuth Client e em `ALLOWED_ORIGINS`.

Para teste local, copie `.env.example` para `.env.local`, preencha os dois valores e execute:

```bash
pnpm install
pnpm dev
```

Sem essas variáveis, o servidor local entra em modo de demonstração e guarda o rascunho apenas no navegador. A compilação publicada, por segurança, mostra “Configuração administrativa pendente” e não aceita dados.

## 5. Validação antes do uso clínico

Faça um teste com dados fictícios e confirme:

1. aluno não cadastrado é recusado;
2. aluno cadastrado vê somente pacientes vinculados;
3. dois navegadores não editam o mesmo atendimento ao mesmo tempo;
4. rascunho abre em outro aparelho;
5. finalização cria os PDFs e bloqueia a versão;
6. correção gera versão posterior sem apagar as respostas anteriores;
7. data de nascimento não aparece nos PDFs;
8. pastas do paciente não são herdadas de uma pasta-mãe compartilhada com toda a turma.

Antes de registrar pacientes reais, revise o aviso de privacidade, a base legal, o termo usado no curso, os prazos de retenção e o procedimento de resposta a incidentes com apoio jurídico/LGPD adequado ao serviço.

## Desenvolvimento

```bash
pnpm build
pnpm lint
```

O artefato estático é gerado em `dist/`.
