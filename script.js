class EstoqueManager {
    constructor() {
        this.produtos = this.loadData('produtos') || [];
        this.movimentacoes = this.loadData('movimentacoes') || [];
        this.charts = {};
        this.init();
    }

    init() {
        console.log('Inicializando sistema...');
        this.setupEventListeners();
        this.renderProducts();
        this.updateTotalValue();
        this.updateMovementSelect();
        this.renderMovements();
        this.initCharts();
        console.log('Sistema inicializado com sucesso!');
    }

    loadData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Erro ao carregar ${key}:`, error);
            return null;
        }
    }

    saveData() {
        try {
            localStorage.setItem('produtos', JSON.stringify(this.produtos));
            localStorage.setItem('movimentacoes', JSON.stringify(this.movimentacoes));
            console.log('Dados salvos com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            this.showNotification('Erro ao salvar dados!', 'error');
        }
    }

    setupEventListeners() {
        // Form de produtos
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addProduct();
            });
        }

        // Form de movimentação
        const movementForm = document.getElementById('movementForm');
        if (movementForm) {
            movementForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addMovement();
            });
        }

        // Form de edição
        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProduct();
            });
        }

        // Busca
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProducts(e.target.value);
            });
        }

        // Modal
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('editModal').style.display = 'none';
            });
        }

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('editModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    addProduct() {
        try {
            const nome = document.getElementById('nome').value.trim();
            const categoria = document.getElementById('categoria').value;
            const quantidade = parseInt(document.getElementById('quantidade').value) || 0;
            const preco = parseFloat(document.getElementById('preco').value) || 0;
            const fornecedor = document.getElementById('fornecedor').value.trim();
            const estoqueMinimo = parseInt(document.getElementById('estoqueMinimo').value) || 5;

            if (!nome || !categoria) {
                this.showNotification('Preencha todos os campos obrigatórios!', 'error');
                return;
            }

            const produto = {
                id: Date.now(),
                nome,
                categoria,
                quantidade,
                preco,
                fornecedor,
                estoqueMinimo,
                dataCadastro: new Date().toISOString()
            };

            this.produtos.push(produto);
            this.saveData();
            this.renderProducts();
            this.updateTotalValue();
            this.updateMovementSelect();
            this.updateCharts();
            
            document.getElementById('productForm').reset();
            this.showNotification('Produto adicionado com sucesso!', 'success');
            
            console.log('Produto adicionado:', produto);
        } catch (error) {
            console.error('Erro ao adicionar produto:', error);
            this.showNotification('Erro ao adicionar produto!', 'error');
        }
    }

    editProduct(id) {
        const produto = this.produtos.find(p => p.id === id);
        if (!produto) {
            this.showNotification('Produto não encontrado!', 'error');
            return;
        }

        document.getElementById('editId').value = produto.id;
        document.getElementById('editNome').value = produto.nome;
        document.getElementById('editCategoria').value = produto.categoria;
        document.getElementById('editQuantidade').value = produto.quantidade;
        document.getElementById('editPreco').value = produto.preco;
        document.getElementById('editFornecedor').value = produto.fornecedor;
        document.getElementById('editEstoqueMinimo').value = produto.estoqueMinimo;

        document.getElementById('editModal').style.display = 'block';
    }

    updateProduct() {
        try {
            const id = parseInt(document.getElementById('editId').value);
            const produtoIndex = this.produtos.findIndex(p => p.id === id);
            
            if (produtoIndex === -1) {
                this.showNotification('Produto não encontrado!', 'error');
                return;
            }

            this.produtos[produtoIndex] = {
                ...this.produtos[produtoIndex],
                nome: document.getElementById('editNome').value.trim(),
                categoria: document.getElementById('editCategoria').value,
                quantidade: parseInt(document.getElementById('editQuantidade').value) || 0,
                preco: parseFloat(document.getElementById('editPreco').value) || 0,
                fornecedor: document.getElementById('editFornecedor').value.trim(),
                estoqueMinimo: parseInt(document.getElementById('editEstoqueMinimo').value) || 5
            };

            this.saveData();
            this.renderProducts();
            this.updateTotalValue();
            this.updateMovementSelect();
            this.updateCharts();
            
            document.getElementById('editModal').style.display = 'none';
            this.showNotification('Produto atualizado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            this.showNotification('Erro ao atualizar produto!', 'error');
        }
    }

    deleteProduct(id) {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            try {
                this.produtos = this.produtos.filter(p => p.id !== id);
                this.saveData();
                this.renderProducts();
                this.updateTotalValue();
                this.updateMovementSelect();
                this.updateCharts();
                this.showNotification('Produto excluído com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao excluir produto:', error);
                this.showNotification('Erro ao excluir produto!', 'error');
            }
        }
    }

    addMovement() {
        try {
            const produtoId = parseInt(document.getElementById('produtoMovimento').value);
            const tipo = document.getElementById('tipoMovimento').value;
            const quantidade = parseInt(document.getElementById('quantidadeMovimento').value) || 0;
            const observacao = document.getElementById('observacao').value.trim();

            if (!produtoId || !tipo || quantidade <= 0) {
                this.showNotification('Preencha todos os campos obrigatórios!', 'error');
                return;
            }

            const produto = this.produtos.find(p => p.id === produtoId);
            if (!produto) {
                this.showNotification('Produto não encontrado!', 'error');
                return;
            }

            // Validar estoque para saída
            if (tipo === 'saida' && produto.quantidade < quantidade) {
                this.showNotification('Estoque insuficiente!', 'error');
                return;
            }

            // Atualizar quantidade
            if (tipo === 'entrada') {
                produto.quantidade += quantidade;
            } else {
                produto.quantidade -= quantidade;
            }

            // Registrar movimentação
            const movimentacao = {
                id: Date.now(),
                produtoId,
                produtoNome: produto.nome,
                tipo,
                quantidade,
                observacao,
                data: new Date().toISOString()
            };

            this.movimentacoes.unshift(movimentacao);
            this.saveData();
            this.renderProducts();
            this.renderMovements();
            this.updateTotalValue();
            this.updateCharts();

            document.getElementById('movementForm').reset();
            this.showNotification(`${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`, 'success');
        } catch (error) {
            console.error('Erro ao registrar movimentação:', error);
            this.showNotification('Erro ao registrar movimentação!', 'error');
        }
    }

    renderProducts() {
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.produtos.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="8">
                        <i class="fas fa-box-open"></i>
                        <p>Nenhum produto cadastrado</p>
                        <small>Adicione seu primeiro produto acima</small>
                    </td>
                </tr>
            `;
            return;
        }

        this.produtos.forEach(produto => {
            const status = this.getStockStatus(produto);
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td><strong>${produto.nome}</strong></td>
                <td>${this.getCategoryName(produto.categoria)}</td>
                <td><strong>${produto.quantidade}</strong></td>
                <td>R$ ${produto.preco.toFixed(2)}</td>
                <td><strong>R$ ${(produto.quantidade * produto.preco).toFixed(2)}</strong></td>
                <td>${produto.fornecedor || '-'}</td>
                <td><span class="${status.class}">${status.text}</span></td>
                <td>
                    <button class="btn-edit" onclick="estoqueManager.editProduct(${produto.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="estoqueManager.deleteProduct(${produto.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    renderMovements() {
        const tbody = document.getElementById('movementsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.movimentacoes.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="5">
                        <i class="fas fa-history"></i>
                        <p>Nenhuma movimentação registrada</p>
                        <small>As movimentações aparecerão aqui</small>
                    </td>
                </tr>
            `;
            return;
        }

        this.movimentacoes.slice(0, 50).forEach(mov => {
            const row = document.createElement('tr');
            const data = new Date(mov.data);
            
            row.innerHTML = `
                <td>${data.toLocaleString('pt-BR')}</td>
                <td><strong>${mov.produtoNome}</strong></td>
                <td>
                    <span style="color: ${mov.tipo === 'entrada' ? '#48bb78' : '#f56565'}; font-weight: 600;">
                        ${mov.tipo === 'entrada' ? '📈 Entrada' : '📉 Saída'}
                    </span>
                </td>
                <td><strong>${mov.quantidade}</strong></td>
                <td>${mov.observacao || '-'}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    filterProducts(searchTerm) {
        const rows = document.querySelectorAll('#productsTableBody tr:not(.empty-state)');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = text.includes(searchTerm.toLowerCase());
            row.style.display = matches ? '' : 'none';
        });
    }

    updateMovementSelect() {
        const select = document.getElementById('produtoMovimento');
        if (!select) return;

        select.innerHTML = '<option value="">Selecione um produto...</option>';
        
        this.produtos.forEach(produto => {
            const option = document.createElement('option');
            option.value = produto.id;
            option.textContent = `${produto.nome} (Estoque: ${produto.quantidade})`;
            select.appendChild(option);
        });
    }

    updateTotalValue() {
        const total = this.produtos.reduce((sum, produto) => {
            return sum + (produto.quantidade * produto.preco);
        }, 0);
        
        const totalElement = document.getElementById('totalValue');
        if (totalElement) {
            totalElement.textContent = `R$ ${total.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }
    }

    getStockStatus(produto) {
        if (produto.quantidade === 0) {
            return { class: 'status-critical', text: 'Sem Estoque' };
        } else if (produto.quantidade <= produto.estoqueMinimo) {
            return { class: 'status-low', text: 'Estoque Baixo' };
        } else {
            return { class: 'status-ok', text: 'Normal' };
        }
    }

    getCategoryName(categoria) {
        const names = {
            'armacao': '🕶️ Armação',
            'lente': '👁️ Lente',
            'acessorio': '🔧 Acessório',
            'ferramenta': '⚒️ Ferramenta'
        };
        return names[categoria] || categoria;
    }

    initCharts() {
        if (this.produtos.length === 0) {
            this.showEmptyCharts();
            return;
        }

        this.createCategoryChart();
        this.createValueChart();
        this.createLowStockChart();
        this.createEvolutionChart();
    }

    showEmptyCharts() {
        const chartSections = document.querySelectorAll('.chart-section canvas');
        chartSections.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados para exibir', canvas.width / 2, canvas.height / 2);
        });
    }

    updateCharts() {
        // Destruir gráficos existentes
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
        
        // Recriar gráficos
        this.initCharts();
    }

    createCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const categoryData = this.getCategoryData();
        
        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.quantities,
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#f5576c'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    createValueChart() {
        const ctx = document.getElementById('valueChart');
        if (!ctx) return;

        const categoryData = this.getCategoryData();
        
        this.charts.value = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    label: 'Valor (R$)',
                    data: categoryData.values,
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: '#667eea',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                        }
                    }
                }
            }
        });
    }

    createLowStockChart() {
        const ctx = document.getElementById('lowStockChart');
        if (!ctx) return;

        const lowStockProducts = this.produtos.filter(p => p.quantidade <= p.estoqueMinimo);
        
        if (lowStockProducts.length === 0) {
            const ctxContext = ctx.getContext('2d');
            ctxContext.clearRect(0, 0, ctx.width, ctx.height);
            ctxContext.fillStyle = '#48bb78';
            ctxContext.font = '16px Inter';
            ctxContext.textAlign = 'center';
            ctxContext.fillText('✅ Todos os produtos com estoque normal!', ctx.width / 2, ctx.height / 2);
            return;
        }
        
        this.charts.lowStock = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: lowStockProducts.map(p => p.nome.substring(0, 15) + '...'),
                datasets: [{
                    label: 'Quantidade Atual',
                    data: lowStockProducts.map(p => p.quantidade),
                    backgroundColor: 'rgba(245, 101, 101, 0.8)',
                    borderColor: '#f56565',
                    borderWidth: 2,
                    borderRadius: 8
                }, {
                    label: 'Estoque Mínimo',
                    data: lowStockProducts.map(p => p.estoqueMinimo),
                    backgroundColor: 'rgba(237, 137, 54, 0.8)',
                    borderColor: '#ed8936',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createEvolutionChart() {
        const ctx = document.getElementById('evolutionChart');
        if (!ctx) return;

        const evolutionData = this.getEvolutionData();
        
        this.charts.evolution = new Chart(ctx, {
            type: 'line',
            data: {
                labels: evolutionData.labels,
                datasets: [{
                    label: 'Valor Total do Estoque',
                    data: evolutionData.values,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                        }
                    }
                }
            }
        });
    }

    getCategoryData() {
        const categories = {};
        
        this.produtos.forEach(produto => {
            if (!categories[produto.categoria]) {
                categories[produto.categoria] = {
                    quantity: 0,
                    value: 0
                };
            }
            categories[produto.categoria].quantity += produto.quantidade;
            categories[produto.categoria].value += produto.quantidade * produto.preco;
        });

        return {
            labels: Object.keys(categories).map(cat => this.getCategoryName(cat)),
            quantities: Object.values(categories).map(cat => cat.quantity),
            values: Object.values(categories).map(cat => cat.value)
        };
    }

    getEvolutionData() {
        // Simular dados de evolução dos últimos 30 dias
        const days = [];
        const values = [];
        const currentValue = this.produtos.reduce((sum, p) => sum + (p.quantidade * p.preco), 0);
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
            
            // Simular variação de ±10% do valor atual
            const variation = (Math.random() - 0.5) * 0.2;
            values.push(Math.max(0, currentValue * (1 + variation)));
        }
        
        return { labels: days, values: values };
    }

    showNotification(message, type = 'info') {
        // Remover notificações existentes
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        // Criar nova notificação
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Remover após 3 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }
}

// Função global para trocar abas
function showTab(tabName) {
    // Remover classe active de todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Ativar aba selecionada
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Atualizar gráficos quando mudar para aba de gráficos
    if (tabName === 'graficos' && window.estoqueManager) {
        setTimeout(() => {
            estoqueManager.updateCharts();
        }, 100);
    }
}

// Inicializar o sistema quando a página carregar
let estoqueManager;
document.addEventListener('DOMContentLoaded', () => {
    estoqueManager = new EstoqueManager();
    console.log('Sistema carregado e pronto para uso!');
});