# ✅ Checklist para Deploy em Produção

## 📋 Antes de fazer Push no GitHub

- [ ] **Arquivo `.env` criado com credenciais reais**
  - Copiar `.env.example` → `.env`
  - Preencher com dados da AWS EC2
  - Nunca fazer commit do `.env`

- [ ] **Dependências instaladas localmente**
  ```bash
  npm install
  ```

- [ ] **Testado localmente**
  ```bash
  npm start
  # Verificar se API está respondendo em http://localhost:3000
  ```

- [ ] **`.gitignore` contém `.env`**
  - Confirmar que não vai subir credenciais

---

## 🌍 GitHub Pages Setup

- [ ] **Repositório criado como `seu-usuario.github.io`**

- [ ] **Repositório é PÚBLICO**

- [ ] **Código feito push para branch `main`**
  ```bash
  git add .
  git commit -m "Deploy: Sistema de Controle de Estoque"
  git push origin main
  ```

- [ ] **GitHub Pages habilitado**
  - Settings > Pages
  - Deploy from branch: `main` / `/ (root)`

- [ ] **Aguardar 1-2 minutos para GitHub Pages processar**

- [ ] **Verificar se está online**
  - Abrir: `https://seu-usuario.github.io`

---

## 🚀 EC2 Backend Setup

- [ ] **Conectado via SSH na EC2**
  ```bash
  ssh -i chave.pem ec2-user@3.92.23.232
  ```

- [ ] **Node.js instalado**
  ```bash
  node --version  # Deve retornar v14+
  ```

- [ ] **Repositório clonado na EC2**
  ```bash
  git clone https://github.com/seu-usuario/seu-repositorio.git
  cd seu-repositorio
  npm install
  ```

- [ ] **`.env` criado com credenciais da AWS**
  - DB_HOST: Seu endpoint RDS
  - DB_USER: admin (ou seu usuário)
  - DB_PASSWORD: sua senha
  - ALLOWED_ORIGINS: `https://seu-usuario.github.io`

- [ ] **Banco de dados criado na RDS**
  ```bash
  mysql -h seu-rds.amazonaws.com -u admin -p
  > CREATE DATABASE estoque;
  > (importar as tabelas necessárias)
  ```

- [ ] **PM2 instalado e configurado**
  ```bash
  sudo npm install -g pm2
  pm2 start server.js --name "estoque-api"
  pm2 startup
  pm2 save
  ```

- [ ] **Security Group da EC2 permite porta 3000**
  - Type: Custom TCP
  - Port: 3000
  - Source: 0.0.0.0/0

---

## 🔗 Conectando Frontend + Backend

- [ ] **URL da API no frontend atualizada**
  - Editar `script.js` e `script_relatorio.js`
  - Ou adicionar em cada HTML:
    ```html
    <script>
      window.API_URL = 'http://3.92.23.232:3000';
    </script>
    ```

- [ ] **CORS configurado no backend**
  - `.env` contém: `ALLOWED_ORIGINS=https://seu-usuario.github.io`

- [ ] **Testado o primeiro formulário**
  - Abrir GitHub Pages
  - Preencher formulário
  - Verificar se salva no banco (EC2)

---

## 🔒 Segurança Final

- [ ] **`.env` está em `.gitignore`** (nunca commitar credenciais)

- [ ] **Senhas do banco são fortes** (não use `1234`)

- [ ] **CORS não aceita todas as origens** (`cors()` ≠ `cors({origin: '*'})`)

- [ ] **EC2 tem autenticação SSH** (não usar pares-chave com permissões 777)

- [ ] **MySQL em RDS** (não localhost)

- [ ] **Backups automáticos ativados** (RDS > Backups)

---

## 🧪 Testes de Validação

### Teste 1: Frontend está online?
```bash
curl https://seu-usuario.github.io
# Deve retornar o HTML do index.html
```

### Teste 2: Backend está respondendo?
```bash
curl http://3.92.23.232:3000/
# Deve retornar: "🚀 API rodando com sucesso!"
```

### Teste 3: CORS funcionando?
Abrir DevTools (F12) no navegador e verificar:
- Console: Se há erros CORS
- Network: Se as requisições são sucesso (200/201)

### Teste 4: Dados sendo salvos?
1. Abrir GitHub Pages
2. Preencher formulário de produto
3. Conectar à EC2: `mysql -h seu-rds.amazonaws.com -u admin -p estoque`
4. Verificar: `SELECT * FROM produtos;`

---

## 📞 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| **CORS Error** | Verificar `ALLOWED_ORIGINS` no `.env` |
| **"Cannot reach API"** | Confirmar IP e porta da EC2; Verificar Security Group |
| **"Cannot connect to database"** | Testar: `mysql -h seu-rds... -u admin -p` |
| **"Port 3000 already in use"** | `sudo fuser -k 3000/tcp` |
| **GitHub Pages mostra 404** | Esperar 2 min; Limpar cache; Confirmar branch |
| **PM2 não inicia** | `pm2 status`; `pm2 logs` para ver erros |

---

## 🎉 Sucesso!

Se todos os testes passarem:

✅ Frontend online em `https://seu-usuario.github.io`  
✅ Backend rodando em `http://3.92.23.232:3000`  
✅ Banco de dados em AWS RDS  
✅ Dados salvando corretamente  

**Projeto está VIVO em produção!** 🚀

---

**Próximos passos opcionais:**
- [ ] Adicionar domínio customizado
- [ ] Habilitar HTTPS no backend
- [ ] Configurar CI/CD (GitHub Actions)
- [ ] Adicionar autenticação de usuários
- [ ] Implementar sistema de permissões
