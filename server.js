require('dotenv').config(); // Carregar variáveis de ambiente

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

// ========================
// MIDDLEWARES
// ========================
// CORS configurado para aceitar requisições do GitHub Pages
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'https://seu-usuario.github.io'],
    credentials: true
}));
app.use(express.json());

// ========================
// CONEXÃO COM O BANCO
// ========================
const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "1234",
    database: process.env.DB_NAME || "estoque",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Erro ao conectar ao banco:", err);
    } else {
        console.log("✅ Banco de dados conectado!");
        connection.release();
    }
});

// ========================
// ROTA TESTE
// ========================
app.get("/", (req, res) => {
    res.send("🚀 API rodando com sucesso!");
});

// ========================
// PRODUTOS
// ========================

// Listar produtos (com busca opcional por nome)
app.get("/produtos", (req, res) => {
    const { nome } = req.query;

    let sql = "SELECT * FROM produtos";
    let params = [];

    if (nome) {
        sql += " WHERE nome LIKE ?";
        params.push(`%${nome}%`);
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ erro: "Erro ao buscar produtos" });
        }
        res.json(results);
    });
});

// Buscar produto por código de barras
app.get("/produtos/:codigo", (req, res) => {
    const { codigo } = req.params;

    const sql = "SELECT * FROM produtos WHERE codigo_barras = ?";
    db.query(sql, [codigo], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ erro: "Erro ao buscar produto" });
        }

        if (results.length === 0) {
            return res.status(404).json({ mensagem: "Produto não encontrado" });
        }

        res.json(results[0]);
    });
});

// Cadastrar produto
app.post("/produtos", (req, res) => {
    const {
        codigo_barras,
        nome,
        categoria,
        descricao,
        fornecedor_id,
        unidade,
        quantidade,
        estoque_min,
        preco_compra,
        preco_venda,
        url_imagem,
        nota_fiscal
    } = req.body;

    const sql = `
        INSERT INTO produtos 
        (codigo_barras, nome, categoria, descricao, fornecedor_id, unidade,
         quantidade, estoque_min, preco_compra, preco_venda, url_imagem)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql, [
        codigo_barras,
        nome,
        categoria,
        descricao,
        fornecedor_id,
        unidade,
        quantidade,
        estoque_min,
        preco_compra,
        preco_venda,
        url_imagem
    ],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ erro: "Erro ao cadastrar produto" });
            }

            const produtoId = result.insertId;

            // Registrar movimentação inicial (Entrada)
            const sqlMov = `
                INSERT INTO movimentacoes 
                (produto_id, tipo, quantidade, valor_unitario, custo, motivo,
                 observacao, usuario, data_movimentacao, nota_fiscal)
                VALUES (?, 'E', ?, ?, ?, 'Cadastro Inicial', '',
                        'Sistema', NOW(), ?)
            `;

            db.query(
                sqlMov, [
                produtoId,
                quantidade,
                preco_compra,
                preco_compra,
                nota_fiscal || ""
            ],
                (errMov) => {
                    if (errMov) {
                        console.error("Erro ao registrar movimentação:", errMov);
                    }
                    res.json({ mensagem: "Produto cadastrado com sucesso!" });
                }
            );
        }
    );
});

// Atualizar produto
app.put("/produtos/:id", (req, res) => {
    const { id } = req.params;
    const { nome, categoria, estoque_min, preco_venda, quantidade, url_imagem } = req.body;

    const sql = `
        UPDATE produtos
        SET nome = ?, categoria = ?, estoque_min = ?, preco_venda = ?,
            quantidade = ?, url_imagem = ?
        WHERE id = ?
    `;

    db.query(
        sql, [nome, categoria, estoque_min, preco_venda, quantidade, url_imagem, id],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ erro: "Erro ao atualizar produto" });
            }
            res.json({ mensagem: "Produto atualizado com sucesso!" });
        }
    );
});

// Remover produto
app.delete("/produtos/:id", (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM produtos WHERE id = ?", [id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ erro: "Erro ao remover produto" });
        }
        res.json({ mensagem: "Produto removido com sucesso!" });
    });
});

// ========================
// FORNECEDORES
// ========================

// Listar fornecedores
app.get("/fornecedores", (req, res) => {
    db.query("SELECT * FROM fornecedores", (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ erro: "Erro ao buscar fornecedores" });
        }
        res.json(results);
    });
});

// Cadastrar fornecedor
app.post("/fornecedores", (req, res) => {
    const { nome, cnpj, telefone, email, endereco } = req.body;

    const sql = `
        INSERT INTO fornecedores
        (nome, cnpj, telefone, email, endereco, data_cadastro)
        VALUES (?, ?, ?, ?, ?, NOW())
    `;

    db.query(sql, [nome, cnpj, telefone, email, endereco], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ erro: "Erro ao cadastrar fornecedor" });
        }
        res.json({ mensagem: "Fornecedor cadastrado com sucesso!", id: result.insertId });
    });
});

// Atualizar fornecedor
app.put("/fornecedores/:id", (req, res) => {
    const { id } = req.params;
    const { nome, cnpj, telefone, email, endereco } = req.body;

    const sql = `
        UPDATE fornecedores
        SET nome = ?, cnpj = ?, telefone = ?, email = ?, endereco = ?
        WHERE id = ?
    `;

    db.query(sql, [nome, cnpj, telefone, email, endereco, id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ erro: "Erro ao atualizar fornecedor" });
        }
        res.json({ mensagem: "Fornecedor atualizado com sucesso!" });
    });
});

// Remover fornecedor
app.delete("/fornecedores/:id", (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM fornecedores WHERE id = ?", [id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ erro: "Erro ao remover fornecedor" });
        }
        res.json({ mensagem: "Fornecedor removido com sucesso!" });
    });
});

// ========================
// REGISTRAR SAÍDA
// ========================
app.post("/saidas", (req, res) => {
    const { produto_id, quantidade, motivo, observacao, valor_unitario } = req.body;

    if (!produto_id || !quantidade || quantidade <= 0) {
        return res.status(400).json({ erro: "Dados inválidos para registrar a saída." });
    }

    // Verificar estoque
    const sqlVerifica = "SELECT quantidade, preco_compra, nome FROM produtos WHERE id = ?";
    db.query(sqlVerifica, [produto_id], (err, results) => {
        if (err) return res.status(500).json({ erro: "Erro ao verificar o produto." });
        if (results.length === 0)
            return res.status(404).json({ erro: "Produto não encontrado." });

        const produto = results[0];

        if (produto.quantidade < quantidade)
            return res.status(400).json({ erro: "Estoque insuficiente." });

        // Atualizar estoque
        db.query(
            "UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?", [quantidade, produto_id],
            (err) => {
                if (err)
                    return res.status(500).json({ erro: "Erro ao atualizar o estoque." });

                // Registrar movimentação
                const sqlMov = `
                    INSERT INTO movimentacoes
                    (produto_id, tipo, quantidade, valor_unitario, custo,
                     motivo, observacao, usuario, data_movimentacao)
                    VALUES (?, 'S', ?, ?, ?, ?, ?, 'Sistema', NOW())
                `;

                db.query(
                    sqlMov, [
                    produto_id,
                    quantidade,
                    valor_unitario || 0,
                    produto.preco_compra || 0,
                    motivo || "Saída",
                    observacao || ""
                ],
                    (err) => {
                        if (err)
                            return res.status(500).json({ erro: "Erro ao registrar a movimentação." });

                        res.json({
                            mensagem: "✅ Saída registrada com sucesso!",
                            produto: produto.nome,
                            quantidade_saida: quantidade
                        });
                    }
                );
            }
        );
    });
});

// ========================
// RELATÓRIOS - MOVIMENTAÇÕES
// ========================
app.get("/movimentacoes", (req, res) => {
    const sql = `
        SELECT 
            m.id,
            p.nome AS produto_nome,
            p.codigo_barras,
            m.tipo,
            m.quantidade,
            m.valor_unitario,
            (m.quantidade * m.valor_unitario) AS valor_total,
            m.motivo,
            m.data_movimentacao AS data,
            p.preco_compra AS custo
        FROM movimentacoes m
        JOIN produtos p ON m.produto_id = p.id
        ORDER BY m.data_movimentacao DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar movimentações:", err);
            return res.status(500).json({ erro: "Erro ao buscar movimentações" });
        }
        res.json(results);
    });
});

// ========================
// CONSULTA DE GTIN (API EXTERNA)
// ========================
app.get("/consultar/:gtin", async (req, res) => {
    const { gtin } = req.params;

    try {
        const response = await fetch(`https://api.cosmos.bluesoft.com.br/gtins/${gtin}.json`, {
            headers: {
                "X-Cosmos-Token": "SEU_TOKEN_AQUI",
                "User-Agent": "Cosmos-API-Request",
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Erro na API externa");
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao consultar a API externa" });
    }
});

// ========================
// INICIAR SERVIDOR
// ========================
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor rodando em modo ${NODE_ENV}`);
    console.log(`🌐 Escutando na porta ${PORT}`);
});