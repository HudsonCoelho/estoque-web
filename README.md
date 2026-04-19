# 📦 Sistema de Controle de Estoque

Um sistema completo de gestão de estoque com frontend moderno (HTML/CSS/JavaScript) e backend robusto (Node.js + MySQL).

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 14+
- MySQL 5.7+
- Git
- Uma conta no GitHub

### Instalação Local

1. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
```

2. **Instale as dependências do backend:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do banco de dados:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=estoque
PORT=3000
NODE_ENV=development
```

4. **Crie o banco de dados:**
```bash
# Execute o script SQL para criar as tabelas
mysql -u root -p estoque < database.sql
```

5. **Inicie o servidor:**
```bash
npm start
```

O servidor estará disponível em `http://localhost:3000`

---

## 🌐 Deploy no GitHub Pages + EC2

### Passo 1: Preparar o Frontend para GitHub Pages

1. **Crie um repositório no GitHub:**
   - Vá para [github.com/new](https://github.com/new)
   - Nome: `seu-usuario.github.io` (substitua seu-usuario)
   - Deixe público

2. **Configure o repositório localmente:**
```bash
git init
git add .
git commit -m "Initial commit: Sistema de Controle de Estoque"
git branch -M main
git remote add origin https://github.com/seu-usuario/seu-usuario.github.io.git
git push -u origin main
```

3. **Ative GitHub Pages:**
   - Vá para Settings > Pages
   - Selecione "Deploy from a branch"
   - Branch: `main`, pasta: `/ (root)`
   - Clique em Save

✅ Seu frontend estará disponível em: `https://seu-usuario.github.io`

---

### Passo 2: Configurar o Backend na EC2

1. **Conecte via SSH:**
```bash
ssh -i sua-chave.pem ec2-user@3.92.23.232
```

2. **Instale Node.js e dependências:**
```bash
curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs
sudo yum install -y mysql
```

3. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
npm install
```

4. **Configure o `.env` na EC2:**
```bash
nano .env
```

```env
DB_HOST=seu-rds-endpoint.amazonaws.com
DB_USER=admin
DB_PASSWORD=sua_senha_segura
DB_NAME=estoque
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://seu-usuario.github.io
```

5. **Inicie o servidor com PM2 (recomendado):**
```bash
sudo npm install -g pm2
pm2 start server.js --name "estoque-api"
pm2 startup
pm2 save
```

---

### Passo 3: Configurar HTTPS na EC2

Se estiver usando um domínio customizado:

```bash
sudo yum install certbot python-certbot-nginx
sudo certbot certonly --standalone -d seu-dominio.com
```

Ou use um certificado auto-assinado para testes.

---

### Passo 4: Configurar Firewall (Security Group)

Na AWS EC2:
1. Vá para Security Groups
2. Adicione regra de entrada:
   - Type: Custom TCP
   - Port: 3000
   - Source: `0.0.0.0/0` (ou restrinja ao seu IP)

---

### Passo 5: Atualizar URL da API no Frontend

Antes de fazer push do código, edite o `index.html` e adicione uma configuração global:

```html
<script>
  // Configure a URL da API antes de qualquer outro script
  window.API_URL = 'https://3.92.23.232:3000'; // ou seu domínio
</script>
```

Ou no início de `script.js` e `script_relatorio.js`, já está configurado para ler `window.API_URL`.

---

## 🔒 Segurança

### ⚠️ IMPORTANTE:
- **Nunca comita** o arquivo `.env` com credenciais reais
- Use variáveis de ambiente na EC2
- Configure CORS apenas para seus domínios
- Use HTTPS em produção
- Mantenha MySQL seguro com senhas fortes

### Checklist de Segurança:
- [ ] `.env` está no `.gitignore`
- [ ] CORS configurado apenas para seu domínio
- [ ] Banco de dados em RDS (não localhost)
- [ ] Senhas criptografadas nas variáveis de ambiente
- [ ] HTTPS habilitado
- [ ] Firewall restricto

---

## 🛠️ Variáveis de Ambiente

Veja `.env.example` para todas as opções disponíveis:

```env
# Banco de Dados
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=1234
DB_NAME=estoque

# Servidor
PORT=3000
NODE_ENV=development

# API (Frontend)
REACT_APP_API_URL=http://localhost:3000
```

---

## 📝 Estrutura do Projeto

```
├── index.html              # Página inicial
├── produtos.html           # Gestão de produtos
├── entradas.html           # Registro de entradas
├── saidas.html             # Registro de saídas
├── fornecedores.html       # Gestão de fornecedores
├── relatorios.html         # Relatórios
├── styles.css              # Estilos globais
├── script.js               # Lógica principal
├── script_relatorio.js     # Lógica de relatórios
├── server.js               # API Express
├── package.json            # Dependências
├── .env.example            # Exemplo de configuração
└── .gitignore              # Arquivos ignorados no Git
```

---

## 🚀 Comandos Úteis

```bash
# Desenvolvimento
npm start

# Com auto-reload (instale nodemon antes)
npm run dev

# Produção na EC2
pm2 start server.js
pm2 status
pm2 stop estoque-api
pm2 restart estoque-api
```

---

## ❓ Troubleshooting

### "Erro ao conectar ao banco de dados"
- Verifique se o MySQL está rodando
- Confirme as credenciais no `.env`
- Teste a conexão: `mysql -h localhost -u root -p`

### "CORS error no frontend"
- Configure `ALLOWED_ORIGINS` no `.env`
- Reinicie o servidor: `pm2 restart estoque-api`

### "Porta 3000 já em uso"
```bash
# Liberar a porta
sudo fuser -k 3000/tcp
# Ou usar outra porta no .env
```

### "GitHub Pages mostra 404"
- Verifique se o repositório é público
- Espere alguns minutos para o Pages atualizar
- Limpe o cache do navegador

---

## 📞 Suporte

Para reportar problemas, abra uma issue no GitHub.

---

## 📄 Licença

Este projeto é licenciado sob ISC.

---

## 👨‍💻 Autor

Desenvolvido com ❤️ por Mateus Oliveira

---

**Última atualização:** Abril de 2026
