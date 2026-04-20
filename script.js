// ===============================
// CONFIGURAÇÃO DA API
// ===============================
// URL da API - Pode ser alterada via variável de ambiente
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://controle-estoque-web.duckdns.org';

console.log(`🔗 API URL: ${API_URL}`);

// ===============================
// CADASTRAR PRODUTO
// ===============================
const form = document.querySelector("form");

if (form && document.getElementById("codigo_barras")) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const elCodigo = document.getElementById("codigo_barras");
        const elNome = document.getElementById("nome");
        const elCategoria = document.getElementById("categoria");
        const elDescricao = document.getElementById("descricao");
        const elUnidade = document.getElementById("unidade");
        const elQuantidade = document.getElementById("quantidade");
        const elEstoqueMin = document.getElementById("estoque_min");
        const elPrecoCompra = document.getElementById("preco_compra");
        const elPrecoVenda = document.getElementById("preco_venda");
        const elUrlImagem = document.getElementById("url_imagem_input") || document.getElementById("url_imagem");
        const elFornecedor = document.getElementById("fornecedor_nome");

        // Verificar se todos os elementos obrigatórios existem
        if (!elCodigo || !elNome || !elCategoria || !elQuantidade || !elEstoqueMin || !elPrecoCompra || !elPrecoVenda) {
            console.warn("Formulário incompleto ou não encontrado nesta página");
            return;
        }

        const codigo = elCodigo.value;
        const f_nome = elFornecedor ? elFornecedor.value : "";
        let fornecedor_id = "";

        if (f_nome && window.fornecedoresStorage) {
            const f_obj = window.fornecedoresStorage.find(f => f.nome === f_nome);
            if (f_obj) fornecedor_id = f_obj.id;
        }

        const produto = {
            codigo_barras: codigo,
            nome: elNome.value,
            categoria: elCategoria.value,
            descricao: elDescricao ? elDescricao.value : "",
            fornecedor_id: fornecedor_id || null,
            unidade: elUnidade ? elUnidade.value : "",
            quantidade: parseInt(elQuantidade.value),
            estoque_min: parseInt(elEstoqueMin.value),
            preco_compra: parseFloat(elPrecoCompra.value),
            preco_venda: parseFloat(elPrecoVenda.value),
            url_imagem: elUrlImagem ? elUrlImagem.value : "",
            nota_fiscal: document.getElementById("nota_fiscal") ? document.getElementById("nota_fiscal").value : null
        };


        try {
            //  Verificar duplicado
            const check = await fetch(`${API_URL}/produtos/${codigo}`);

            if (check.ok) {
                alert("⚠️ Produto já cadastrado!");
                return;
            }

            //  Salvar no banco
            await fetch(`${API_URL}/produtos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(produto)
            });

            alert("✅ Produto salvo no banco!");

            listarProdutos();
            atualizarCards();

            document.querySelector("form").reset();

        } catch (error) {
            console.error(error);
            alert("❌ Erro ao salvar produto");
        }
    });
}


// ===============================
// LISTAR PRODUTOS
// ===============================
async function listarProdutos() {
    try {
        const response = await fetch(`${API_URL}/produtos`);
        let produtos = await response.json();

        const lista = document.getElementById("lista-produtos");
        if (!lista) return;

        if (produtos.length === 0) {
            lista.innerHTML = `<div>📭 Nenhum produto cadastrado</div>`;
            return;
        }

        // 
        lista.innerHTML = "";

        // Mostrar os produtos mais recentes primeiro
        produtos = produtos.reverse();

        produtos.forEach(p => {
            lista.innerHTML += `
                <div class="produto-card">
                    <strong>${p.nome}</strong>

                    <div class="produto-info">
                        Código: ${p.codigo_barras}<br>
                        Categoria: ${p.categoria || "—"}<br>
                        Quantidade: ${p.quantidade}<br>
                        Estoque mínimo: ${p.estoque_min}<br>
                        Compra: R$ ${Number(p.preco_compra).toFixed(2)}<br>
                        Venda: R$ ${Number(p.preco_venda).toFixed(2)}
                    </div>

                    ${p.url_imagem ? `<img src="${p.url_imagem}" style="height:100px; width:auto; max-width:100%; border-radius:8px; margin-top:10px; margin-bottom:10px; object-fit: contain; display:block;">` : ""}

                    <button class="btn-excluir" onclick="remover(${p.id})">🗑️ Excluir</button>
                </div>
            `;
        });

    } catch (error) {
        console.error(error);
    }
}


// ===============================
// REMOVER PRODUTO
// ===============================
async function remover(id) {
    if (!confirm("Deseja excluir?")) return;

    try {
        await fetch(`${API_URL}/produtos/${id}`, {
            method: "DELETE"
        });

        listarProdutos();
        atualizarCards();

    } catch (error) {
        console.error(error);
    }
}


// ===============================
// ATUALIZAR CARDS 
// ===============================
async function atualizarCards() {
    const elProdutos = document.getElementById("produtos");
    const elEntradas = document.getElementById("entradas");
    const elNovos = document.getElementById("novos");
    const elEstoque = document.getElementById("estoque");
    const elTotalVendas = document.getElementById("total-vendas");

    const elSaidaProdutos = document.getElementById("saida_card_produtos");
    const elSaidaSaidasHoje = document.getElementById("saida_card_saidas_hoje");
    const elSaidaValorHoje = document.getElementById("saida_card_valor_hoje");
    const elSaidaEstoqueBaixo = document.getElementById("saida_card_estoque_baixo");
    const elSaidaTotalEstoque = document.getElementById("saida_card_total_estoque");

    // Se nenhum card existir na página, não faz nada
    if (!elProdutos && !elEntradas && !elNovos && !elEstoque && !elTotalVendas &&
        !elSaidaProdutos && !elSaidaSaidasHoje && !elSaidaValorHoje && !elSaidaEstoqueBaixo && !elSaidaTotalEstoque) return;

    try {
        const response = await fetch(`${API_URL}/produtos`);
        const produtos = await response.json();

        let total = produtos.length;
        let estoqueBaixo = 0;
        let totalVendas = 0;
        let entradasHoje = 0;
        const hojeObj = new Date();
        hojeObj.setHours(0, 0, 0, 0);

        produtos.forEach(p => {
            if (p.quantidade < p.estoque_min) estoqueBaixo++;
            totalVendas += p.quantidade * p.preco_venda;

            if (p.data_cadastro) {
                const dataProd = new Date(p.data_cadastro);
                dataProd.setHours(0, 0, 0, 0);
                if (dataProd.getTime() === hojeObj.getTime()) {
                    entradasHoje++;
                }
            }
        });

        if (elProdutos) elProdutos.innerText = total;
        if (elEntradas) elEntradas.innerText = entradasHoje;
        if (elNovos) elNovos.innerText = entradasHoje;
        if (elEstoque) elEstoque.innerText = estoqueBaixo + " itens";
        if (elTotalVendas) elTotalVendas.innerText = "R$ " + totalVendas.toFixed(2);

        if (elSaidaProdutos) elSaidaProdutos.innerText = total;
        if (elSaidaEstoqueBaixo) elSaidaEstoqueBaixo.innerText = estoqueBaixo + " itens";
        if (elSaidaTotalEstoque) elSaidaTotalEstoque.innerText = "R$ " + totalVendas.toFixed(2);

        // Saídas Hoje 
        if (elSaidaSaidasHoje || elSaidaValorHoje) {
            try {
                const resSaidas = await fetch(`${API_URL}/saidas`);
                if (resSaidas.ok) {
                    const logSaidas = await resSaidas.json();
                    let qtdSaidas = 0;
                    let valorSaidas = 0;
                    logSaidas.forEach(req => {
                        const dataS = new Date(req.data);
                        dataS.setHours(0, 0, 0, 0);
                        if (dataS.getTime() === hojeObj.getTime()) {
                            qtdSaidas += req.quantidade || 0;
                            valorSaidas += Number(req.valor_total) || 0;
                        }
                    });
                    if (elSaidaSaidasHoje) elSaidaSaidasHoje.innerText = qtdSaidas;
                    if (elSaidaValorHoje) elSaidaValorHoje.innerText = "R$ " + valorSaidas.toFixed(2);
                }
            } catch (errSaida) {
                console.error("Erro ao buscar saidas p/ os cards", errSaida);
            }
        }

    } catch (error) {
        console.error(error);
    }
}


// ===============================
// CONSULTAR PRODUTO (GTIN)
// ===============================
const btnConsultarAPI = document.getElementById('btnConsultarAPI');

if (btnConsultarAPI) {
    btnConsultarAPI.addEventListener('click', async () => {
        const elCodigoBarras = document.getElementById('codigo_barras');
        if (!elCodigoBarras) return;

        const gtin = elCodigoBarras.value.trim();

        if (!gtin) return alert("Digite um código de barras");

        btnConsultarAPI.innerText = "⏳...";

        try {
            const response = await fetch(`${API_URL}/consultar/${gtin}`);

            if (!response.ok) throw new Error();

            const data = await response.json();

            const elNome = document.getElementById('nome');
            const elDescricao = document.getElementById('descricao');
            const elUrlImagem = document.getElementById('url_imagem');
            const elUrlImagemInput = document.getElementById('url_imagem_input');

            if (elNome) elNome.value = data.description || "";
            if (elDescricao) elDescricao.value = data.description || "";

            if (data.gpc) {
                selecionarCategoriaPorTexto(data.gpc.description);
            }

            const fotoUrl = data.thumbnail || (data.brand && data.brand.picture_url) || "";
            if (elUrlImagem) elUrlImagem.value = fotoUrl;
            if (fotoUrl && elUrlImagemInput) {
                elUrlImagemInput.value = fotoUrl;
            }

        } catch (error) {
            alert("❌ Erro ao consultar produto");
        } finally {
            btnConsultarAPI.innerText = "🔍 Consultar";
        }
    });
}


// ===============================
// AUXILIAR CATEGORIA
// ===============================
function selecionarCategoriaPorTexto(texto) {
    const select = document.getElementById('categoria');

    for (let i = 0; i < select.options.length; i++) {
        if (texto.toLowerCase().includes(select.options[i].text.toLowerCase())) {
            select.selectedIndex = i;
            break;
        }
    }
}


// ===============================
// CARREGAR FORNECEDORES AUTOCOMPLETE
// ===============================
async function carregarFornecedores() {
    const inputFornecedor = document.getElementById("fornecedor_nome");
    const containerLista = document.getElementById("lista_fornecedores_custom");
    if (!inputFornecedor || !containerLista) return;

    let isSelecting = false;

    try {
        const response = await fetch(`${API_URL}/fornecedores`);
        if (!response.ok) throw new Error("Erro na API");
        const fornecedores = await response.json();

        window.fornecedoresStorage = fornecedores;

        const normalizar = (str) => {
            if (!str) return "";
            return str.trim()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-zA-Z0-9\s]/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .toLowerCase();
        };

        function renderLista(array) {
            containerLista.innerHTML = "";
            const val = normalizar(inputFornecedor.value);

            const itensParaMostrar = array.filter(f => normalizar(f.nome) !== val);

            if (itensParaMostrar.length === 0) {
                containerLista.classList.remove("show");
                return;
            }

            itensParaMostrar.forEach(f => {
                const item = document.createElement("div");
                item.className = "autocomplete-item";
                item.style.cssText = "color: #333 !important; background: #fff !important; padding: 10px !important; border-bottom: 1px solid #eee !important; cursor: pointer !important; white-space: nowrap !important; overflow: hidden; text-overflow: ellipsis;";

                if (val) {
                    const escapedVal = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`(${escapedVal})`, "gi");
                    item.innerHTML = f.nome.replace(regex, "<strong>$1</strong>");
                } else {
                    item.innerHTML = f.nome;
                }

                item.addEventListener("click", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    isSelecting = true;
                    inputFornecedor.value = f.nome;
                    containerLista.innerHTML = "";
                    containerLista.classList.remove("show");
                    inputFornecedor.blur();
                    setTimeout(() => {
                        isSelecting = false;
                    }, 500);
                });
                containerLista.appendChild(item);
            });
        }

        inputFornecedor.addEventListener("input", function () {
            if (isSelecting) return;

            let val = normalizar(this.value);
            if (!val) {
                // Quando fica vazio, fecha o dropdown
                containerLista.classList.remove("show");
                containerLista.innerHTML = "";
                return;
            }

            const filtrados = fornecedores.filter(f => normalizar(f.nome).includes(val));
            const matching = fornecedores.find(f => normalizar(f.nome) === val);

            if (matching) {
                containerLista.classList.remove("show");
                return;
            }

            if (filtrados.length > 0) {
                containerLista.classList.add("show");
                renderLista(filtrados);
            } else {
                containerLista.classList.remove("show");
            }
        });

        inputFornecedor.addEventListener("focus", function () {
            if (isSelecting) return;

            const val = normalizar(this.value);
            const matching = fornecedores.find(f => normalizar(f.nome) === val);

            if (val === "") {
                containerLista.classList.remove("show");
            } else if (matching) {
                containerLista.classList.remove("show");
            } else {
                containerLista.classList.add("show");
                const filtrados = fornecedores.filter(f => normalizar(f.nome).includes(val));
                renderLista(filtrados);
            }
        });

        inputFornecedor.addEventListener("blur", function () {
            setTimeout(() => {
                containerLista.classList.remove("show");
            }, 150);
        });

        document.addEventListener("mousedown", function (e) {
            if (e.target !== inputFornecedor && !containerLista.contains(e.target)) {
                containerLista.classList.remove("show");
            }
        });

    } catch (error) {
        console.error("Erro ao carregar fornecedores:", error);
    }
}

// ===============================
// CARREGAR AO ABRIR
// ===============================
if (document.getElementById("lista-produtos")) listarProdutos();
carregarFornecedores();
atualizarCards();

// ===============================
// BUSCA AUTOMÁTICA
// ===============================

// API_URL já declarado no topo do arquivo

let listaProdutosStorage = [];

window.abrirEdicao = (id) => {
    const produto = listaProdutosStorage.find(p => p.id == id);
    if (!produto) return;

    // Verificar se o modal existe na página
    const elFormEdicao = document.getElementById("formEdicao");
    const elModalNome = document.getElementById("modal-nome");
    const elModalCategoria = document.getElementById("modal-categoria");
    const elModalEstoqueMin = document.getElementById("modal-estoque-min");
    const elModalQuantidade = document.getElementById("modal-quantidade");
    const elModalPreco = document.getElementById("modal-preco");
    const elModalImagem = document.getElementById("modal-imagem");
    const elPreviewImagem = document.getElementById("previewImagem");
    const elImagemPreview = document.getElementById("imagemPreview");
    const elModalEdicao = document.getElementById("modalEdicao");

    if (!elFormEdicao || !elModalNome || !elModalEdicao) {
        console.warn("Modal de edição não encontrado nesta página");
        return;
    }

    // Preencher o formulário do modal com os dados do produto
    if (elModalNome) elModalNome.value = produto.nome || "";
    if (elModalCategoria) elModalCategoria.value = produto.categoria || "";
    if (elModalEstoqueMin) elModalEstoqueMin.value = produto.estoque_min || 0;
    if (elModalQuantidade) elModalQuantidade.value = produto.quantidade || 0;
    if (elModalPreco) elModalPreco.value = produto.preco_venda || 0;
    if (elModalImagem) elModalImagem.value = produto.url_imagem || "";

    // Armazenar o ID do produto sendo editado
    if (elFormEdicao) elFormEdicao.dataset.produtoId = id;

    // Mostrar preview da imagem se existir
    if (elPreviewImagem && elImagemPreview) {
        if (produto.url_imagem) {
            elPreviewImagem.style.display = "block";
            elImagemPreview.src = produto.url_imagem;
        } else {
            elPreviewImagem.style.display = "none";
        }
    }

    // Abrir o modal
    if (elModalEdicao) elModalEdicao.classList.add("ativa");
};

window.fecharModal = () => {
    const elModalEdicao = document.getElementById("modalEdicao");
    if (elModalEdicao) {
        elModalEdicao.classList.remove("ativa");
    }
};

window.salvarEdicao = async (event) => {
    if (event) event.preventDefault();

    const elFormEdicao = document.getElementById("formEdicao");
    if (!elFormEdicao) return;

    const id = elFormEdicao.dataset.produtoId;
    const produto = listaProdutosStorage.find(p => p.id == id);
    if (!produto) return;

    const elModalNome = document.getElementById("modal-nome");
    const elModalCategoria = document.getElementById("modal-categoria");
    const elModalEstoqueMin = document.getElementById("modal-estoque-min");
    const elModalQuantidade = document.getElementById("modal-quantidade");
    const elModalPreco = document.getElementById("modal-preco");
    const elModalImagem = document.getElementById("modal-imagem");

    if (!elModalNome || !elModalEstoqueMin || !elModalQuantidade || !elModalPreco) {
        console.warn("Campos do formulário não encontrados");
        return;
    }

    const novoNome = elModalNome.value.trim();
    const novaCategoria = elModalCategoria ? elModalCategoria.value.trim() : "";
    const novoEstoqueMin = parseInt(elModalEstoqueMin.value);
    const novaQtd = parseInt(elModalQuantidade.value);
    const novoPreco = parseFloat(elModalPreco.value);
    const novaUrlImagem = elModalImagem ? elModalImagem.value.trim() : "";

    // Validar campos obrigatórios
    if (!novoNome) {
        alert("❌ O nome do produto é obrigatório!");
        return;
    }

    if (isNaN(novoEstoqueMin) || novoEstoqueMin < 0) {
        alert("❌ Estoque mínimo deve ser um número válido!");
        return;
    }

    if (isNaN(novaQtd) || novaQtd < 0) {
        alert("❌ Quantidade deve ser um número válido!");
        return;
    }

    if (isNaN(novoPreco) || novoPreco < 0) {
        alert("❌ Preço deve ser um número válido!");
        return;
    }

    const produtoAtualizado = {
        ...produto,
        nome: novoNome,
        categoria: novaCategoria,
        estoque_min: novoEstoqueMin,
        quantidade: novaQtd,
        preco_venda: novoPreco,
        url_imagem: novaUrlImagem
    };

    try {
        const res = await fetch(`${API_URL}/produtos/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(produtoAtualizado)
        });

        if (res.ok) {
            alert("✅ Produto atualizado com sucesso!");
            fecharModal();
            carregarTodosOsProdutos();
        } else {
            alert("❌ Erro ao atualizar o produto. O servidor pode não suportar esta ação.");
        }
    } catch (error) {
        console.error(error);
        alert("❌ Falha na conexão com o servidor.");
    }
};

async function carregarTodosOsProdutos() {
    const container = document.querySelector(".card-produtos");
    if (!container) return;

    container.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>⏳ Carregando produtos...</p>";
    try {
        const res = await fetch(`${API_URL}/produtos`);
        let todos = await res.json();

        container.innerHTML = "";

        if (todos.length === 0) {
            container.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>📭 Nenhum produto encontrado.</p>";
            return;
        }

        // Inverter a lista para exibir os últimos cadastrados no topo
        listaProdutosStorage = todos.reverse();

        listaProdutosStorage.forEach(p => {
            const estoqueAbaixoMinimo = p.quantidade < p.estoque_min;
            container.innerHTML += `
                <div class="card-produto" id="card-${p.id}" ${estoqueAbaixoMinimo ? 'style="border: 2px solid #e74c3c;"' : ''}>
                    ${p.url_imagem ? `<img src="${p.url_imagem}" style="height:100px; width:auto; max-width:100%; border-radius:8px; margin-bottom:8px; object-fit: contain;">` : ""}
                    <h3>${p.nome}</h3>
                    <p><strong>Cód:</strong> ${p.codigo_barras || "—"}</p>
                    <p><strong>Categoria:</strong> ${p.categoria || "—"}</p>
                    <p><strong>Preço:</strong> R$ ${Number(p.preco_venda).toFixed(2)}</p>
                    <p><strong>Estoque:</strong> ${p.quantidade} ${estoqueAbaixoMinimo ? '⚠️' : ''}</p>
                    <p style="font-size: 0.75rem; color: #7f8c8d;"><strong>Mínimo:</strong> ${p.estoque_min}</p>
                    <div style="margin-top: 10px; display: flex; gap: 5px; justify-content: center; width: 100%;">
                        <button onclick="abrirEdicao('${p.id}')" class="btn-editar">Editar</button>
                    </div>
                </div>
            `;
        });
    } catch (e) {
        console.error(e);
        container.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: red;'>❌ Erro ao carregar os produtos.</p>";
    }
}

window.onload = () => {

    const inputBusca = document.getElementById("inputBusca");
    const container = document.querySelector(".card-produtos");

    if (!inputBusca || !container) return;

    // Carregar todos os produtos assim que a página abrir
    carregarTodosOsProdutos();


    let timeout;

    inputBusca.addEventListener("input", () => {
        clearTimeout(timeout);

        timeout = setTimeout(async () => {
            const valor = inputBusca.value.trim();

            if (!valor) {
                // Se a busca estiver vazia, carrega todos os produtos de volta
                carregarTodosOsProdutos();
                return;
            }

            try {
                // 🔢 código de barras
                if (/^\d+$/.test(valor)) {
                    const res = await fetch(`${API_URL}/produtos/${valor}`);

                    if (!res.ok) {
                        container.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>Produto não encontrado</p>";
                        return;
                    }

                    const p = await res.json();

                    listaProdutosStorage = [p];

                    const estoqueAbaixoMinimo = p.quantidade < p.estoque_min;
                    container.innerHTML = `
                        <div class="card-produto" id="card-${p.id}" ${estoqueAbaixoMinimo ? 'style="border: 2px solid #e74c3c;"' : ''}>
                            ${p.url_imagem ? `<img src="${p.url_imagem}" style="height:100px; width:auto; max-width:100%; border-radius:8px; margin-bottom:8px; object-fit: contain;">` : ""}
                            <h3>${p.nome}</h3>
                            <p><strong>Cód:</strong> ${p.codigo_barras || "—"}</p>
                            <p><strong>Categoria:</strong> ${p.categoria || "—"}</p>
                            <p><strong>Preço:</strong> R$ ${Number(p.preco_venda).toFixed(2)}</p>
                            <p><strong>Estoque:</strong> ${p.quantidade} ${estoqueAbaixoMinimo ? '⚠️' : ''}</p>
                            <p style="font-size: 0.75rem; color: #7f8c8d;"><strong>Mínimo:</strong> ${p.estoque_min}</p>
                            <div style="margin-top: 10px; display: flex; gap: 5px; justify-content: center; width: 100%;">
                                <button onclick="abrirEdicao('${p.id}')" class="btn-editar">Editar</button>
                            </div>
                        </div>
                    `;
                }

                // 🔤 nome
                else {
                    const res = await fetch(`${API_URL}/produtos`);
                    const todos = await res.json();
                    const lista = todos.filter(p =>
                        p.nome && p.nome.toLowerCase().includes(valor.toLowerCase())
                    );

                    container.innerHTML = "";

                    if (lista.length === 0) {
                        container.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>Nenhum produto encontrado com este nome.</p>";
                        return;
                    }

                    listaProdutosStorage = lista;

                    lista.forEach(p => {
                        const estoqueAbaixoMinimo = p.quantidade < p.estoque_min;
                        container.innerHTML += `
                            <div class="card-produto" id="card-${p.id}" ${estoqueAbaixoMinimo ? 'style="border: 2px solid #e74c3c;"' : ''}>
                                ${p.url_imagem ? `<img src="${p.url_imagem}" style="height:100px; width:auto; max-width:100%; border-radius:8px; margin-bottom:8px; object-fit: contain;">` : ""}
                                <h3>${p.nome}</h3>
                                <p><strong>Cód:</strong> ${p.codigo_barras || "—"}</p>
                                <p><strong>Categoria:</strong> ${p.categoria || "—"}</p>
                                <p><strong>Preço:</strong> R$ ${Number(p.preco_venda).toFixed(2)}</p>
                                <p><strong>Estoque:</strong> ${p.quantidade} ${estoqueAbaixoMinimo ? '⚠️' : ''}</p>
                                <p style="font-size: 0.75rem; color: #7f8c8d;"><strong>Mínimo:</strong> ${p.estoque_min}</p>
                                <div style="margin-top: 10px; display: flex; gap: 5px; justify-content: center; width: 100%;">
                                    <button onclick="abrirEdicao('${p.id}')" class="btn-editar">Editar</button>
                                </div>
                            </div>
                        `;
                    });
                }

            } catch (e) {
                console.error(e);
                container.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: red;'>Erro ao buscar</p>";
            }

        }, 400);
    });

};

// 📦 MOSTRAR UM PRODUTO
function mostrarProduto(produto, container) {
    container.innerHTML = `
        <div class="card-produto">
            <h3>${produto.nome}</h3>
            <p><strong>Código:</strong> ${produto.codigo_barras}</p>
            <p><strong>Categoria:</strong> ${produto.categoria || '-'}</p>
            <p><strong>Preço:</strong> R$ ${produto.preco_venda}</p>
            
        </div>
    `;
}


// 📦 MOSTRAR LISTA
function mostrarLista(produtos, container) {
    container.innerHTML = "";

    produtos.forEach(produto => {
        container.innerHTML += `
            <div class="card-produto">
                <h3>${produto.nome}</h3>
                <p><strong>Código:</strong> ${produto.codigo_barras}</p>
                <p><strong>Categoria:</strong> ${produto.categoria || '-'}</p>
                <p><strong>Preço:</strong> R$ ${produto.preco_venda}</p>
                
            </div>
        `;
    });
}

// ====== EVENT LISTENERS PARA O MODAL ======

// Adicionar listener para o formulário do modal
document.addEventListener("DOMContentLoaded", () => {
    const formEdicao = document.getElementById("formEdicao");
    const inputImagem = document.getElementById("modal-imagem");
    const previewDiv = document.getElementById("previewImagem");
    const imagemPreview = document.getElementById("imagemPreview");

    if (formEdicao) {
        formEdicao.addEventListener("submit", salvarEdicao);
    }

    if (inputImagem) {
        inputImagem.addEventListener("input", () => {
            const url = inputImagem.value.trim();

            if (previewDiv && imagemPreview) {
                if (url) {
                    previewDiv.style.display = "block";
                    imagemPreview.src = url;
                    imagemPreview.onerror = () => {
                        previewDiv.style.display = "none";
                    };
                } else {
                    previewDiv.style.display = "none";
                }
            }
        });
    }

    // Fechar modal ao clicar fora dele
    const modal = document.getElementById("modalEdicao");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                fecharModal();
            }
        });
    }
});


// ===============================
// CADASTRAR FORNECEDOR
// ===============================
const formFornecedor = document.getElementById("formFornecedor");
if (formFornecedor) {
    formFornecedor.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fornecedor = {
            nome: document.getElementById("nome_fornecedor").value,
            cnpj: document.getElementById("cnpj").value.replace(/\D/g, ''),
            telefone: document.getElementById("telefone").value.replace(/\D/g, ''),
            email: document.getElementById("email").value,
            endereco: document.getElementById("endereco").value
        };

        try {
            const response = await fetch("http://3.92.23.232:3000/fornecedores", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fornecedor)
            });

            if (response.ok) {
                alert("✅ Fornecedor cadastrado!");
                formFornecedor.reset();
                listarFornecedores();
            } else {
                const err = await response.json();
                if (err.code === 'ER_DUP_ENTRY') alert("⚠️ Este CNPJ já está cadastrado!");
                else alert("❌ Erro ao cadastrar fornecedor");
            }
        } catch (error) {
            console.error(error);
            alert("❌ Erro de conexão");
        }
    });
}

// ===============================
// LISTAR E BUSCAR FORNECEDORES (API)
// ===============================
let todosFornecedores = [];

async function listarFornecedores() {
    const lista = document.getElementById("lista-fornecedores");
    const elTotal = document.getElementById("total-fornecedores");
    if (!lista) return;

    try {
        const response = await fetch("http://3.92.23.232:3000/fornecedores");
        const fornecedores = await response.json();

        todosFornecedores = fornecedores.reverse();
        renderizarFornecedores(todosFornecedores);

        if (elTotal) elTotal.innerText = todosFornecedores.length;
    } catch (error) {
        console.error("Erro ao listar fornecedores:", error);
    }
}

function renderizarFornecedores(fornecedores) {
    const lista = document.getElementById("lista-fornecedores");
    if (!lista) return;

    lista.innerHTML = "";

    if (fornecedores.length === 0) {
        lista.innerHTML = "<div style='grid-column: 1/-1; text-align: center;' class='mensagem-vazia'>Nenhum fornecedor encontrado</div>";
        return;
    }

    fornecedores.forEach(f => {
        lista.innerHTML += `
            <div class="card-produto" style="align-items: flex-start; text-align: left; background: #fff; padding: 1.2rem; border-left: 5px solid #3498db; position: relative;">
                <h3 style="margin-bottom: 8px; color: #2c3e50; font-size: 1.1rem; width: 100%;">🏢 ${f.nome}</h3>
                <p style="margin: 4px 0; font-size: 0.9rem; color: #444;"><strong>CNPJ:</strong> ${f.cnpj || "—"}</p>
                <p style="margin: 4px 0; font-size: 0.9rem; color: #444;"><strong>Telefone:</strong> ${f.telefone || "—"}</p>
                <p style="margin: 4px 0; font-size: 0.9rem; color: #444;"><strong>Email:</strong> ${f.email || "—"}</p>
                <p style="margin: 4px 0; font-size: 0.85rem; color: #7f8c8d;"><strong>Endereço:</strong> ${f.endereco || "—"}</p>
                <div style="margin-top: 15px; display: flex; gap: 8px; width: 100%;">
                    <button onclick="abrirEdicaoFornecedor(${f.id})" style="flex: 1; padding: 8px; font-size: 0.9rem; background: #3498db; color: #fff; border: none; border-radius: 6px; cursor: pointer; transition: 0.2s;">✏️ Editar</button>
                    <button onclick="removerFornecedor(${f.id})" style="flex: 1; padding: 8px; font-size: 0.9rem; background: #e74c3c; color: #fff; border: none; border-radius: 6px; cursor: pointer; transition: 0.2s;">🗑️ Excluir</button>
                </div>
            </div>
        `;
    });
}

const inputBuscaFornecedor = document.getElementById("inputBuscaFornecedor");
if (inputBuscaFornecedor) {
    inputBuscaFornecedor.addEventListener("input", (e) => {
        const termo = e.target.value.toLowerCase().trim();
        if (!termo) {
            renderizarFornecedores(todosFornecedores);
            return;
        }

        const filtrados = todosFornecedores.filter(f => {
            const nomeStr = (f.nome || "").toLowerCase();
            const cnpjStr = (f.cnpj || "").replace(/\D/g, '');
            const termoCnpj = termo.replace(/\D/g, '');

            return nomeStr.includes(termo) || (termoCnpj !== "" && cnpjStr.includes(termoCnpj));
        });
        renderizarFornecedores(filtrados);
    });
}

// ===============================
// EDITAR FORNECEDORES
// ===============================
window.abrirEdicaoFornecedor = (id) => {
    const fnc = todosFornecedores.find(f => f.id == id);
    if (!fnc) return;

    document.getElementById("modal-forn-nome").value = fnc.nome;
    document.getElementById("modal-forn-cnpj").value = fnc.cnpj;
    document.getElementById("modal-forn-telefone").value = fnc.telefone || "";
    document.getElementById("modal-forn-email").value = fnc.email || "";
    document.getElementById("modal-forn-endereco").value = fnc.endereco || "";

    const form = document.getElementById("formEdicaoFornecedor");
    if (form) form.dataset.fornecedorId = id;

    const modal = document.getElementById("modalEdicaoFornecedor");
    if (modal) modal.classList.add("ativa");
};

window.fecharModalFornecedor = () => {
    const modal = document.getElementById("modalEdicaoFornecedor");
    if (modal) modal.classList.remove("ativa");
};

const formEdicaoFornecedor = document.getElementById("formEdicaoFornecedor");
if (formEdicaoFornecedor) {
    formEdicaoFornecedor.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = formEdicaoFornecedor.dataset.fornecedorId;

        const atualizado = {
            nome: document.getElementById("modal-forn-nome").value,
            cnpj: document.getElementById("modal-forn-cnpj").value.replace(/\D/g, ''),
            telefone: document.getElementById("modal-forn-telefone").value.replace(/\D/g, ''),
            email: document.getElementById("modal-forn-email").value,
            endereco: document.getElementById("modal-forn-endereco").value
        };

        try {
            const res = await fetch(`http://3.92.23.232:3000/fornecedores/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(atualizado)
            });

            if (res.ok) {
                alert("✅ Fornecedor atualizado com sucesso!");
                fecharModalFornecedor();
                listarFornecedores();
            } else {
                alert("❌ Erro ao atualizar o fornecedor.");
            }
        } catch (error) {
            console.error(error);
            alert("❌ Falha na conexão com o servidor.");
        }
    });
}

// ===============================
// REMOVER FORNECEDOR
// ===============================
async function removerFornecedor(id) {
    if (!confirm("Deseja excluir este fornecedor?")) return;

    try {
        const response = await fetch("http://3.92.23.232:3000/fornecedores/" + id, {
            method: "DELETE"
        });

        if (response.ok) {
            listarFornecedores();
        } else {
            alert("❌ Erro ao excluir fornecedor. Verifique se há produtos vinculados a ele.");
        }
    } catch (error) {
        console.error(error);
    }
}

// ===============================
// INICIALIZAR FORNECEDORES
// ===============================
if (document.getElementById("lista-fornecedores")) {
    listarFornecedores();
}

// ===============================
// LÓGICA DE SAÍDAS
// ===============================
const formSaida = document.getElementById("formSaida");
const btnBuscarSaida = document.getElementById("btnBuscarSaida");

if (btnBuscarSaida) {
    btnBuscarSaida.addEventListener("click", async () => {
        const codigo = document.getElementById("saida_codigo_barras").value.trim();
        if (!codigo) return alert("Digite ou escaneie o código de barras");

        btnBuscarSaida.innerText = "⏳...";
        try {
            const res = await fetch("http://3.92.23.232:3000/produtos");
            const produtos = await res.json();
            const produto = produtos.find(p => p.codigo_barras === codigo || p.id == codigo);

            if (produto) {
                document.getElementById("saida_nome").value = produto.nome;
                document.getElementById("saida_categoria").value = produto.categoria || "—";
                document.getElementById("saida_estoque_atual").innerText = produto.quantidade;
                document.getElementById("saida_produto_id").value = produto.id;
                document.getElementById("saida_preco_compra").value = produto.preco_compra || 0;
                document.getElementById("saida_preco_venda").value = produto.preco_venda || 0;
                window.produtoAtualParaSaida = produto;
            } else {
                alert("Produto não encontrado no estoque.");
                if (document.getElementById("formSaida")) document.getElementById("formSaida").reset();
                document.getElementById("saida_estoque_atual").innerText = "—";
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao buscar produto.");
        } finally {
            btnBuscarSaida.innerText = "🔍 Buscar";
        }
    });
}

if (formSaida) {
    formSaida.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id = document.getElementById("saida_produto_id").value;
        const qtd = parseInt(document.getElementById("saida_quantidade").value);
        const motivo = document.getElementById("saida_motivo").value;

        if (!id || !window.produtoAtualParaSaida) {
            return alert("Por favor, localize um produto primeiro.");
        }
        if (isNaN(qtd) || qtd <= 0) {
            return alert("Digite uma quantidade válida para a saída.");
        }
        if (qtd > window.produtoAtualParaSaida.quantidade) {
            return alert("Estoque insuficiente para essa quantidade de saída.");
        }

        const produtoAnterior = window.produtoAtualParaSaida;
        const novoEstoque = produtoAnterior.quantidade - qtd;

        const atualizado_payload = {
            produto_id: id,
            quantidade: qtd,
            motivo: motivo,
            observacao: document.getElementById("saida_observacao") ? document.getElementById("saida_observacao").value : "",
            valor_unitario: produtoAnterior.preco_venda
        };

        try {
            const res = await fetch(`http://3.92.23.232:3000/saidas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(atualizado_payload)
            });

            if (res.ok) {
                alert("✅ Saída registrada com sucesso!");
                formSaida.reset();
                document.getElementById("saida_estoque_atual").innerText = "—";
                window.produtoAtualParaSaida = null;

                atualizarCards();
                listarSaidasHistorico();
            } else {
                alert("❌ Erro ao dar baixa no banco de dados.");
            }
        } catch (error) {
            console.error(error);
            alert("❌ Erro de conexão ao registrar saída.");
        }
    });
}

async function listarSaidasHistorico() {
    const lista = document.getElementById("lista-saidas");
    if (!lista) return;

    try {
        const response = await fetch("http://3.92.23.232:3000/saidas");
        let logSaidas = await response.json();

        lista.innerHTML = "";

        if (logSaidas.length === 0) {
            lista.innerHTML = `<div style='grid-column: 1/-1; text-align: center; width: 100%; color: #7f8c8d; margin-top: 20px;'>📭 Nenhum registro de saída encontrado hoje</div>`;
            return;
        }

        logSaidas.forEach(req => {
            const d = new Date(req.data);
            const formatData = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}`;

            lista.innerHTML += `
                <div class="card-produto" style="align-items: flex-start; text-align: left; background: #fff; padding: 1.2rem; border-left: 5px solid #e74c3c; margin-bottom: 10px; width: 100%;">
                    <h3 style="margin-bottom: 8px; color: #2c3e50; font-size: 1.1rem; width: 100%;">📤 ${req.produto_nome}</h3>
                    <p style="margin: 4px 0; font-size: 0.9rem; color: #444;"><strong>Código:</strong> ${req.codigo_barras || "—"}</p>
                    <p style="margin: 4px 0; font-size: 0.9rem; color: #444;"><strong>Qtd Saída:</strong> <span style="font-weight: bold; color: #e74c3c;">-${req.quantidade}</span></p>
                    <p style="margin: 4px 0; font-size: 0.9rem; color: #444;"><strong>Motivo:</strong> ${req.motivo || "Não informado"}</p>
                    <p style="margin: 4px 0; font-size: 0.9rem; color: #444;"><strong>Valor Total:</strong> R$ ${Number(req.valor_total).toFixed(2)}</p>
                    <p style="margin: 4px 0; font-size: 0.85rem; color: #7f8c8d;"><strong>Data:</strong> ${formatData}</p>
                </div>
            `;
        });
    } catch (error) {
        console.error("Erro ao carregar histórico de saídas: ", error);
        lista.innerHTML = `<div style='grid-column: 1/-1; text-align: center; width: 100%; color: #e74c3c; margin-top: 20px;'>❌ Erro ao buscar histórico de saídas</div>`;
    }
}

if (document.getElementById("lista-saidas")) {
    listarSaidasHistorico();
}
// ========================
// LISTAR MOVIMENTAÇÕES
// ========================
app.get("/movimentacoes", (req, res) => {
    const sql = `
        SELECT 
            m.id,
            m.tipo,
            m.quantidade,
            m.valor_unitario,
            m.data_movimentacao AS data,
            m.nota_fiscal,
            p.nome AS produto_nome,
            p.preco_compra AS custo
        FROM movimentacoes m
        JOIN produtos p ON p.id = m.produto_id
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