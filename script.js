// CONTROLE DE ESTADOS DO APP
let pricePerUnit = 0;
let prizeValue = 0;
let currentTicketName = "";
let currentQuantity = 1;

// SISTEMA DE MEMÓRIA LOCAL (LOCALSTORAGE)
function getLocalData() {
    let data = localStorage.getItem("roda_dos_10_data");
    if (!data) {
        // Inicializa simulando que o pool global de compras já está em 6 para não ficar zerado
        data = { balance: 0.00, purchasedTicketsCount: 0, globalPoolCount: 6 };
        localStorage.setItem("roda_dos_10_data", JSON.stringify(data));
        return data;
    }
    let parsed = JSON.parse(data);
    if (parsed.globalPoolCount === undefined) parsed.globalPoolCount = 6;
    return parsed;
}

function saveLocalData(data) {
    localStorage.setItem("roda_dos_10_data", JSON.stringify(data));
    updateDashboardMetrics();
}

// ATUALIZA INTERFACE DO DASHBOARD E PROGRESSO DE COMPRAS
function updateDashboardMetrics() {
    const balanceEl = document.getElementById("dash-balance");
    const ticketsEl = document.getElementById("dash-tickets");
    const progressFill = document.getElementById("meta-progress-fill");
    const progressText = document.getElementById("meta-text-count");
    
    const data = getLocalData();

    if (balanceEl) balanceEl.innerText = `R$ ${data.balance.toFixed(2).replace(".", ",")}`;
    if (ticketsEl) ticketsEl.innerText = data.purchasedTicketsCount;

    // Atualiza a barra de progresso (Limite de 20 compras)
    let currentPool = data.globalPoolCount;
    if (currentPool > 20) currentPool = 20; // limite de segurança visual
    
    const percentage = (currentPool / 20) * 100;
    
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressText) progressText.innerText = `${currentPool} / 20 Compras`;
}

// COMPRA / MODAL FUNCTIONS
function openModal(name, price, prize) {
    currentTicketName = name;
    pricePerUnit = price;
    prizeValue = prize;
    currentQuantity = 1;

    const nameEl = document.getElementById("m-ticket-name");
    const prizeEl = document.getElementById("m-ticket-prize");
    const clientNameEl = document.getElementById("client-name");

    if (nameEl) nameEl.innerText = name;
    if (prizeEl) prizeEl.innerText = `Concorra a R$ ${prize.toFixed(2)} no Pix`;
    if (clientNameEl) clientNameEl.value = "";

    recalculateTotal();
    document.getElementById("modalCompra").classList.add("active");
}

function closeModal() {
    document.getElementById("modalCompra").classList.remove("active");
}

function changeQuantity(factor) {
    currentQuantity += factor;
    if (currentQuantity < 1) currentQuantity = 1;
    recalculateTotal();
}

function recalculateTotal() {
    const qtyDisplay = document.getElementById("qty-display");
    const totalDisplay = document.getElementById("total-display");
    if (qtyDisplay) qtyDisplay.innerText = currentQuantity;
    
    const finalPrice = pricePerUnit * currentQuantity;
    if (totalDisplay) totalDisplay.innerText = `R$ ${finalPrice.toFixed(2).replace(".", ",")}`;
}

// COMPRA ENVIADA AO WHATSAPP DO SUPORTE
function sendOrder() {
    const clientName = document.getElementById("client-name").value.trim();

    if (!clientName) {
        fireToast("Por favor, preencha seu nome completo.", true);
        return;
    }

    const finalValueStr = (pricePerUnit * currentQuantity).toFixed(2).replace(".", ",");
    
    const textMessage = 
        `🎯 *RODA DOS 10 - NOVO PEDIDO* 🎯\n\n` +
        `👤 *Nome:* ${clientName}\n` +
        `🎫 *Tipo:* ${currentTicketName}\n` +
        `🔢 *Quantidade:* ${currentQuantity} cota(s)\n` +
        `📈 *Contagem de Metas:* Conta como +${currentQuantity} compras na rodada!\n` +
        `💰 *Valor Total:* R$ ${finalValueStr}\n\n` +
        `🍀 *Sorteio por Nome:* Seu nome será inserido ${currentQuantity} vezes no sorteio assim que bater a meta de 20!`;

    // Incrementa dados de simulação locais
    let data = getLocalData();
    data.purchasedTicketsCount += currentQuantity;
    data.globalPoolCount += currentQuantity; // Incrementa a barra de meta
    saveLocalData(data);

    fireToast("Pedido gerado! Abrindo suporte...");
    
    setTimeout(() => {
        window.open(`https://wa.me/639759981028?text=${encodeURIComponent(textMessage)}`, '_blank');
        closeModal();
    }, 1200);
}

// SOLICITAÇÃO DE SAQUE MANUAL VIA WHATSAPP
function requestWithdraw() {
    const amountInput = document.getElementById("withdraw-amount");
    const nameInput = document.getElementById("withdraw-name");
    
    if (!amountInput || !nameInput) return;

    const amount = parseFloat(amountInput.value);
    const name = nameInput.value.trim();
    let data = getLocalData();

    if (isNaN(amount) || amount < 30) {
        fireToast("O valor mínimo para saques é de R$ 30,00.", true);
        return;
    }
    if (!name) {
        fireToast("Insira seu nome completo para a liberação manual.", true);
        return;
    }
    if (amount > data.balance) {
        fireToast("Saldo de indicação insuficiente para esse saque.", true);
        return;
    }

    data.balance -= amount;
    saveLocalData(data);

    const withdrawMessage = 
        `💰 *RODA DOS 10 - SOLICITAÇÃO DE SAQUE* 💰\n\n` +
        `👤 *Nome:* ${name}\n` +
        `💵 *Valor do Saque:* R$ ${amount.toFixed(2).replace(".", ",")}\n\n` +
        `Enviei os dados e solicito o pagamento manual conforme as regras de indicação.`;

    fireToast("Solicitação gerada! Enviando dados ao suporte...");
    
    setTimeout(() => {
        window.open(`https://wa.me/639759981028?text=${encodeURIComponent(withdrawMessage)}`, '_blank');
        amountInput.value = "";
        nameInput.value = "";
    }, 1200);
}

// ADICIONAR BÔNUS SIMULADO DE AFILIADO
function simulateCommission() {
    let data = getLocalData();
    data.balance += 20.00;
    saveLocalData(data);
    fireToast("Indicação simulada com sucesso! +R$ 20,00");
}

// COPIAR LINK AFILIADO
function copyLink() {
    const copyText = document.getElementById("referral-link");
    if (!copyText) return;
    
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
    
    fireToast("Link de indicação copiado!");
}

// SISTEMA PREMIUM DE TOAST
function fireToast(message, isError = false) {
    const toast = document.getElementById("toastBox");
    const icon = document.getElementById("toastIcon");
    const msgEl = document.getElementById("toastMessage");

    if (!toast || !icon || !msgEl) return;

    msgEl.innerText = message;

    if (isError) {
        toast.style.borderLeftColor = "#EF4444";
        icon.className = "fa-solid fa-circle-xmark";
        icon.style.color = "#EF4444";
    } else {
        toast.style.borderLeftColor = "var(--neon-green)";
        icon.className = "fa-solid fa-circle-check";
        icon.style.color = "var(--neon-green)";
    }

    toast.classList.add("active");
    setTimeout(() => toast.classList.remove("active"), 4000);
}

window.onclick = function(event) {
    const backdrop = document.getElementById("modalCompra");
    if (event.target === backdrop) closeModal();
}
