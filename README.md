# 📦 Sistema de Controle de Estoque

Um sistema completo de gestão de estoque online e responsivo com frontend moderno (HTML/CSS/JavaScript) e API backend robusta (Node.js + Express + MySQL).

---

## 🌐 Acesso Online

O projeto já está **em produção** e pode ser acessado através dos links abaixo:

- 💻 **Aplicação Web (Frontend):** [Acessar a Aplicação](https://hudsoncoelho.github.io/estoque-web/)
  - Hospedado no **GitHub Pages**.
- ⚙️ **API Backend:** `https://controle-estoque-web.duckdns.org`
  - Hospedado na **AWS EC2**, com proxy reverso Nginx configurado com SSL (HTTPS via Let's Encrypt).

---

## 🚀 Funcionalidades

- **Gestão de Produtos:** Cadastro, edição e deleção de itens do estoque.
- **Entradas e Saídas:** Controle de adição e retirada de produtos, com formato de preço exato, mantendo o histórico de movimentações no sistema.
- **Fornecedores:** Gestão completa de fornecedores com interface de busca via autocomplete e janelas modais de edição.
- **Relatórios:** Dashboard intuitivo para análise em tempo real do histórico de transações, totalizadores, fechamento e filtro de extrato.
- **Sincronização em Tempo Real:** Conexão direta com banco MySQL centralizado em nuvem via requisições assíncronas do frontend.

---

## 💻 Instalação Local (Desenvolvimento)

### Pré-requisitos
- Node.js 14+ ou superior
- MySQL 5.7+ ou superior
- Git

### Passo a passo

1. **Clone o repositório:**
```bash
git clone https://github.com/HudsonCoelho/estoque-web.git
cd estoque-web
```

2. **Instale as dependências do backend:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
Copie o modelo para um novo arquivo `.env` e ajuste as credenciais:
```bash
cp .env.example .env
```
_Parâmetros do `.env`:_
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_local
DB_NAME=estoque
PORT=3000
ALLOWED_ORIGINS=*
```

4. **Crie o banco de dados:**
Execute e crie o banco relacional de desenvolvimento:
```bash
mysql -u root -p < database.sql
```

5. **Inicie o servidor (API):**
```bash
npm start
```
_O servidor estará disponível na máquina em `http://localhost:3000`._

---

## ☁️ Arquitetura de Deploy 

### Frontend
- As páginas (`.html`), estilos (`.css`) e scripts (`.js`) são diretamente distribuídas e hospedadas via **GitHub Pages** (Branch `main`).

### Backend
1. Está contido em uma instância Linux EC2 pela **Amazon Web Services**.
2. A aplicação Express corre de forma background gerenciada pelo utilitário **PM2**.
3. Assinatura do domínio gratuíta `controle-estoque-web.duckdns.org` direciona IP dinâmico/estático da instância.
4. O servidor utiliza o **Nginx** como Web Server e Proxy Reverso, bloqueando tráfego não-seguro (HTTP) nas portas do Node, recebendo via HTTPS (porta 443 via Let's Encrypt Certbot) e repassando em loopback para a API na porta `3000`.

---

## 📝 Estrutura de Arquivos

```text
├── index.html              # Página inicial
├── produtos.html           # Gestão de produtos
├── entradas.html           # Registro de entradas no estoque
├── saidas.html             # Registro de saídas do estoque
├── fornecedores.html       # Gestão de dados dos fornecedores
├── relatorios.html         # Central com históricos de transações 
├── styles.css              # Diretrizes de estilo globais (UI/UX)
├── script.js               # Comportamentos JS na maioria das visualizações
├── script_relatorio.js     # Domínio computacional isolado na renderização de relatórios
├── server.js               # Código fonte da API e CRUD centralizado (Node/Express)
├── package.json            # Dependências geridas pelo npm
├── .env.example            # Layout do arquivo de configuração local das Envs
└── .gitignore              # Lista de pastas bloqueadas do GitHub commit
```

---

## 🔒 Segurança

- Nenhum arquivo `.env` com senhas em aberto foi salvo no commit graças ao `.gitignore`.
- Conexões protegidas via CORS para bloquear tráfego de domínios maliciosos.
- Sem *Mixed Content*: Com a comunicação via HTTPS pela porta 443 do backend proxy server o navegador entende a requisição como criptografada.

---

## 📞 Suporte e Contato

Para reportar problemas ou sugerir novas features em nossa integração, por favor abram publicamente uma issue no GitHub.

---

## 👨‍💻 Autor

Desenvolvido por **Hudson Coelho**.

**Data da Última Atualização:** Abril de 2026
