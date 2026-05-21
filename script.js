// ==========================================
// CONTROLE DE ESTADOS DO APP (RODA DOS 10)
// ==========================================
let pricePerUnit = 0;
let prizeValue = 0;
let currentTicketName = "";
let currentQuantity = 1;

// ==========================================
// SISTEMA DE MEMÓRIA LOCAL (LOCALSTORAGE)
// ==========================================
function getLocalData() {
    let data = localStorage.getItem("roda_dos_10_data");
    if (!data) {
        // Inicializa simulando que o pool global de compras já está em 6 para não iniciar do zero absoluto
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

// ==========================================
// ATUALIZA INTERFACE DO DASHBOARD E PROGRESSO
// ==========================================
function updateDashboardMetrics() {
    const balanceEl = document.getElementById("dash-balance");
    const ticketsEl = document.getElementById("dash-tickets");
    const progressFill = document.getElementById("meta-progress-fill");
    const progressText = document.getElementById("meta-text-count");
    
    const data = getLocalData();

    if (balanceEl) balanceEl.innerText = `R$ ${data.balance.toFixed(2).replace(".", ",")}`;
    if (ticketsEl) ticketsEl.innerText = data.purchasedTicketsCount;

    // Atualiza a barra de progresso baseada na meta de 20 compras estipulada pelo Pandinhaofc
    let currentPool = data.globalPoolCount;
    if (currentPool > 20) currentPool = 20; // Limite visual de segurança da barra
    
    const percentage = (currentPool / 20) * 100;
    
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressText) progressText.innerText = `${currentPool} / 20 Compras`;
}

// ==========================================
// FUNÇÕES DO MODAL PREMIUM DE COMPRA
// ==========================================
function openPurchaseModal(name, price, prize) {
    // Converte os valores recebidos do HTML (strings com vírgula) em números decimais puros
    currentTicketName = name;
    pricePerUnit = parseFloat(price.toString().replace(",", "."));
    prizeValue = parseFloat(prize.toString().replace(",", "."));
    currentQuantity = 1;

    // Mapeia os elementos internos do Modal Premium
    const nameEl = document.getElementById("modalPlanTitle");
    const descEl = document.getElementById("modalPlanDesc");
    const clientNameInput = document.getElementById("client-name");

    if (nameEl) nameEl.innerText = `Adquirir ${name}`;
    
    // Reseta o input do nome para evitar lixo de sessões anteriores
    if (clientNameInput) clientNameInput.value = "";

    // Atualiza as quantidades e o valor total dinamicamente
    recalculateTotal();
    
    // Abre a overlay do modal aplicando a classe CSS
    const modal = document.getElementById("purchaseModal");
    if (modal) modal.classList.add("active");
}

function closePurchaseModal() {
    const modal = document.getElementById("purchaseModal");
    if (modal) modal.classList.remove("active");
}

function changeQuantity(factor) {
    currentQuantity += factor;
    if (currentQuantity < 1) currentQuantity = 1;
    recalculateTotal();
}

function recalculateTotal() {
    const qtyDisplay = document.getElementById("qty-display");
    const totalDisplay = document.getElementById("total-display");
    const descEl = document.getElementById("modalPlanDesc");
    
    if (qtyDisplay) qtyDisplay.innerText = currentQuantity;
    
    const finalPrice = pricePerUnit * currentQuantity;
    if (totalDisplay) totalDisplay.innerText = `R$ ${finalPrice.toFixed(2).replace(".", ",")}`;
    
    if (descEl) {
        descEl.innerHTML = `Você está adquirindo <strong>${currentQuantity} cota(s)</strong> para o plano <strong>${currentTicketName}</strong>.<br>` + 
                           `Seu nome será inserido <strong>${currentQuantity} vezes</strong> no sorteio assim que a meta de 20 compras da rodada for atingida!`;
    }
}

// ==========================================
// ENVIO DE PEDIDO VIA WHATSAPP (COMPRA)
// ==========================================
function confirmPurchase() {
    const clientNameInput = document.getElementById("client-name");
    const clientName = clientNameInput ? clientNameInput.value.trim() : "";

    if (!clientName) {
        fireToast("Por favor, preencha seu nome completo para o sorteio.", true);
        return;
    }

    const finalValueStr = (pricePerUnit * currentQuantity).toFixed(2).replace(".", ",");
    
    // Constrói a mensagem otimizada contendo a regra de repetição por nome
    const textMessage = 
        `🎯 *RODA DOS 10 - NOVO PEDIDO DE COTAS* 🎯\n\n` +
        `👤 *Nome do Participante:* ${clientName}\n` +
        `🎫 *Plano Escolhido:* ${currentTicketName}\n` +
        `🔢 *Quantidade Adquirida:* ${currentQuantity} Cota(s)\n` +
        `📈 *Impacto na Rodada:* Conta como +${currentQuantity} compras na meta total!\n` +
        `💰 *Valor Total do Pedido:* R$ ${finalValueStr}\n\n` +
        `🍀 *Regra do Sorteio:* O nome desse usuário será repetido *${currentQuantity} vezes* nas urnas assim que o plano bater o limite de 20 compras! Aguardando liberação.`;

    // Salva o progresso localmente na máquina do usuário para fins visuais de simulação
    let data = getLocalData();
    data.purchasedTicketsCount += currentQuantity;
    data.globalPoolCount += currentQuantity; // Incrementa o progresso de 20 vagas
    saveLocalData(data);

    fireToast("Cota gerada! Abrindo chat do suporte...");
    
    setTimeout(() => {
        window.open(`https://wa.me/639759981028?text=${encodeURIComponent(textMessage)}`, '_blank');
        closePurchaseModal();
    }, 1200);
}

// ==========================================
// SOLICITAÇÃO DE SAQUE MANUAL (MÍNIMO R$ 25)
// ==========================================
function requestWithdraw() {
    const amountInput = document.getElementById("withdraw-amount");
    const nameInput = document.getElementById("withdraw-name");
    
    if (!amountInput || !nameInput) return;

    const amount = parseFloat(amountInput.value);
    const name = nameInput.value.trim();
    let data = getLocalData();

    // Validações estritas de segurança conforme regras de negócio
    if (isNaN(amount) || amount < 25) {
        fireToast("O valor mínimo para saques foi definido em R$ 25,00.", true);
        return;
    }
    if (!name) {
        fireToast("Insira seu nome completo para validação manual do suporte.", true);
        return;
    }
    if (amount > data.balance) {
        fireToast("Saldo de comissões insuficiente para realizar este saque.", true);
        return;
    }

    // Deduz o valor aprovado do saldo simulado
    data.balance -= amount;
    saveLocalData(data);

    const withdrawMessage = 
        `💰 *RODA DOS 10 - SOLICITAÇÃO DE SAQUE MÍNIMO* 💰\n\n` +
        `👤 *Nome do Afiliado:* ${name}\n` +
        `💵 *Valor Solicitado:* R$ ${amount.toFixed(2).replace(".", ",")}\n\n` +
        `Enviei meus dados de faturamento e solicito o envio imediato via PIX manual conforme as diretrizes da plataforma.`;

    fireToast("Pedido enviado! Transmitindo dados de saque...");
    
    setTimeout(() => {
        window.open(`https://wa.me/639759981028?text=${encodeURIComponent(withdrawMessage)}`, '_blank');
        amountInput.value = "";
        nameInput.value = "";
    }, 1200);
}

// ==========================================
// SIMULADORES ADICIONAIS / AFILIADOS
// ==========================================
function simulateCommission() {
    let data = getLocalData();
    data.balance += 20.00; // Incrementa R$ 20 de comissão única fixa por indicação
    saveLocalData(data);
    fireToast("Nova indicação registrada! +R$ 20,00 de saldo.");
}

function copyLink() {
    const copyText = document.getElementById("referral-link");
    if (!copyText) return;
    
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
    
    fireToast("Link de afiliado premium copiado!");
}

// ==========================================
// CONTROLE DO TOAST PREMIUM DESIGN
// ==========================================
function fireToast(message, isError = false) {
    const toast = document.getElementById("toastNotification");
    const icon = document.getElementById("toastIcon");
    const msgEl = document.getElementById("toastMsg");

    if (!toast || !msgEl) return;

    msgEl.innerText = message;

    // Altera dinamicamente as bordas e os ícones com base no feedback
    if (isError) {
        toast.style.borderLeftColor = "#EF4444";
        if (icon) {
            icon.className = "fa-solid fa-circle-xmark";
            icon.style.color = "#EF4444";
        }
    } else {
        toast.style.borderLeftColor = "var(--neon-green)";
        if (icon) {
            icon.className = "fa-solid fa-circle-check";
            icon.style.color = "var(--neon-green)";
        }
    }

    toast.classList.add("active");
    setTimeout(() => {
        toast.classList.remove("active");
    }, 4000);
}

// Close modal checking background click
window.addEventListener("click", function(event) {
    const backdrop = document.getElementById("purchaseModal");
    if (backdrop && event.target === backdrop) {
        closePurchaseModal();
    }
});

// Inicialização automática das métricas na viewport
document.addEventListener("DOMContentLoaded", () => {
    updateDashboardMetrics();
});
