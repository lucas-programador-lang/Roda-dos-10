// VARIÁVEIS DE CONTROLE ESTADO DO APP
let pricePerUnit = 0;
let prizeValue = 0;
let currentTicketName = "";
let currentQuantity = 1;

// FUNÇÃO PARA ABRIR O MODAL
function openModal(name, price, prize) {
    currentTicketName = name;
    pricePerUnit = price;
    prizeValue = prize;
    currentQuantity = 1;

    // Atualiza dados estáticos dentro do modal
    document.getElementById("m-ticket-name").innerText = name;
    document.getElementById("m-ticket-prize").innerText = `Concorra a R$ ${prize.toFixed(2)} no Pix`;
    document.getElementById("client-name").value = "";

    recalculateTotal();
    document.getElementById("modalCompra").classList.add("active");
}

// FUNÇÃO PARA FECHAR O MODAL
function closeModal() {
    document.getElementById("modalCompra").classList.remove("active");
}

// CONTROLE DE QUANTIDADE (+ ou -)
function changeQuantity(factor) {
    currentQuantity += factor;
    if (currentQuantity < 1) {
        currentQuantity = 1;
    }
    recalculateTotal();
}

// RECALCULA O TOTAL DA COMPRA DO MODAL
function recalculateTotal() {
    document.getElementById("qty-display").innerText = currentQuantity;
    const finalPrice = pricePerUnit * currentQuantity;
    document.getElementById("total-display").innerText = `R$ ${finalPrice.toFixed(2).replace(".", ",")}`;
}

// MOSTRAR TOAST (ALERTA PREMIUM)
function fireToast(message, isError = false) {
    const toast = document.getElementById("toastBox");
    const icon = document.getElementById("toastIcon");

    document.getElementById("toastMessage").innerText = message;

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

    // Remove automaticamente após 4 segundos
    setTimeout(() => {
        toast.classList.remove("active");
    }, 4000);
}

// ENVIO DE INFORMAÇÕES VIA WHATSAPP
function sendOrder() {
    const clientName = document.getElementById("client-name").value.trim();

    // Validação nativa com Toast de erro
    if (!clientName) {
        fireToast("Por favor, digite seu nome completo.", true);
        return;
    }

    const finalValueStr = (pricePerUnit * currentQuantity).toFixed(2).replace(".", ",");
    
    // Montagem da mensagem estruturada profissionalmente
    const textMessage = 
        `🚀 *NOVO PEDIDO DE COTA* 🚀\n\n` +
        `👤 *Nome:* ${clientName}\n` +
        `🎫 *Tipo:* ${currentTicketName}\n` +
        `🔢 *Quantidade:* ${currentQuantity} cota(s)\n` +
        `💰 *Valor Total:* R$ ${finalValueStr}\n\n` +
        `🍀 *Concorrendo a:* R$ ${prizeValue.toFixed(2)} no Pix!`;

    // Converte para formato de URL segura
    const encodedMessage = encodeURIComponent(textMessage);
    const targetUrl = `https://wa.me/639759981028?text=${encodedMessage}`;

    fireToast("Pedido gerado! Redirecionando para o suporte...");

    setTimeout(() => {
        window.open(targetUrl, "_blank");
        closeModal();
    }, 1500);
}

// Fecha o modal caso o usuário clique na área borrada de fora
window.onclick = function(event) {
    const modalBackdrop = document.getElementById("modalCompra");
    if (event.target === modalBackdrop) {
        closeModal();
    }
}
