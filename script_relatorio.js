// ========================
// CONFIGURAÇÃO DA API
// ========================
// URL da API - Pode ser alterada via variável de ambiente
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'
    : (window.API_URL || 'http://3.92.23.232:3000');

console.log(`🔗 API URL: ${API_URL}`);

let dadosRelatorioGlobal = [];
let grafico = null;

// ========================
// GERAR RELATÓRIO
// ========================
async function gerarRelatorio() {
    const dataInicio = document.getElementById("data_inicio").value;
    const dataFim = document.getElementById("data_fim").value;
    const tipoFiltro = document.getElementById("tipo").value;

    try {
        const response = await fetch(`${API_URL}/movimentacoes`);
        if (!response.ok) throw new Error("Erro ao buscar movimentações");

        let movimentacoes = await response.json();

        // Filtro por data
        if (dataInicio) {
            movimentacoes = movimentacoes.filter(m =>
                new Date(m.data) >= new Date(`${dataInicio}T00:00:00`)
            );
        }

        if (dataFim) {
            movimentacoes = movimentacoes.filter(m =>
                new Date(m.data) <= new Date(`${dataFim}T23:59:59`)
            );
        }

        // Filtro por tipo
        if (tipoFiltro) {
            const mapTipo = { entrada: "E", saida: "S" };
            movimentacoes = movimentacoes.filter(
                m => m.tipo === mapTipo[tipoFiltro]
            );
        }

        dadosRelatorioGlobal = movimentacoes;
        renderizarRelatorio(movimentacoes);

    } catch (error) {
        console.error(error);
        alert("❌ Erro ao gerar relatório");
    }
}

// ========================
// RENDERIZAR RELATÓRIO
// ========================
function renderizarRelatorio(movs) {
    const tabela = document.getElementById("tabela");
    tabela.innerHTML = "";

    let receita = 0;
    let custo = 0;
    let qtd = 0;

    movs.forEach(m => {
        const data = new Date(m.data).toLocaleDateString('pt-BR');
        const produto = m.produto_nome || "Produto não identificado";
        const tipo = m.tipo === "E" ? "Entrada" : "Saída";
        const quantidade = Number(m.quantidade) || 0;
        const valorUnitario = Number(m.valor_unitario) || 0;
        const valorTotal = Number(m.valor_total) || (valorUnitario * quantidade);
        const custoUnitario = Number(m.custo) || 0;
        const custoTotal = custoUnitario * quantidade;

        // Apenas saídas geram receita
        if (m.tipo === "S") {
            receita += valorTotal;
            custo += custoTotal;
            qtd += quantidade;
        }

        tabela.innerHTML += `
            <tr>
                <td>${data}</td>
                <td>${produto}</td>
                <td>${tipo}</td>
                <td>${quantidade}</td>
                <td>${valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td>${valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td>${custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            </tr>
        `;
    });

    // Atualização dos cards
    document.getElementById("total").innerText =
        receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    document.getElementById("qtd").innerText = qtd;

    document.getElementById("custo").innerText =
        custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    document.getElementById("lucro").innerText =
        (receita - custo).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

    gerarGrafico(movs);
}

// ========================
// GRÁFICO
// ========================
function gerarGrafico(movs) {
    const ctx = document.getElementById("graficoRelatorio");

    const entradas = movs.filter(m => m.tipo === "E").length;
    const saidas = movs.filter(m => m.tipo === "S").length;

    if (grafico) grafico.destroy();

    grafico = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Entradas", "Saídas"],
            datasets: [{
                label: "Movimentações",
                data: [entradas, saidas]
            }]
        }
    });
}

// ========================
// RELATÓRIO DE ESTOQUE
// ========================
async function relatorioEstoque() {
    try {
        const response = await fetch(`${API_URL}/produtos`);
        const produtos = await response.json();

        const tabela = document.getElementById("tabela");
        tabela.innerHTML = "";

        produtos.forEach(p => {
            tabela.innerHTML += `
                <tr>
                    <td>-</td>
                    <td>${p.nome}</td>
                    <td>Estoque</td>
                    <td>${p.quantidade}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error(error);
        alert("Erro ao gerar relatório de estoque");
    }
}

// ========================
// EXPORTAR PARA EXCEL
// ========================
function exportarExcel() {
    const dados = dadosRelatorioGlobal.map(m => ({
        Data: new Date(m.data).toLocaleDateString('pt-BR'),
        Produto: m.produto_nome,
        Tipo: m.tipo === "E" ? "Entrada" : "Saída",
        Quantidade: m.quantidade,
        Valor_Unitario: m.valor_unitario,
        Valor_Total: m.valor_total,
        Custo: m.custo
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
    XLSX.writeFile(wb, "relatorio.xlsx");
}

// ========================
// EXPORTAR PARA PDF
// ========================
function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Relatório de Movimentações", 14, 15);

    doc.autoTable({
        startY: 20,
        head: [
            ["Data", "Produto", "Tipo", "Qtd", "Valor Unit.", "Total"]
        ],
        body: dadosRelatorioGlobal.map(m => [
            new Date(m.data).toLocaleDateString('pt-BR'),
            m.produto_nome,
            m.tipo === "E" ? "Entrada" : "Saída",
            m.quantidade,
            `R$ ${Number(m.valor_unitario).toFixed(2)}`,
            `R$ ${Number(m.valor_total).toFixed(2)}`
        ])
    });

    doc.save("relatorio.pdf");
}