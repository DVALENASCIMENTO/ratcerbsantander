// Funções para manipulação de inputs e validação
document.addEventListener('DOMContentLoaded', function() {
    // Configuração dos campos de hora (apenas números)
    const horaInputs = document.querySelectorAll('.time-input input');
    horaInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            
            // Validação para horas (0-23) e minutos (0-59)
            if (this.id.includes('-h') && this.value.length === 2) {
                const hora = parseInt(this.value);
                if (hora > 23) this.value = '23';
                
                // Move para o próximo campo (minutos)
                const minutoInput = this.parentElement.querySelector('[id$="-m"]');
                if (minutoInput) minutoInput.focus();
            }
            
            if (this.id.includes('-m') && this.value.length === 2) {
                const minuto = parseInt(this.value);
                if (minuto > 59) this.value = '59';
                
                // Move para o próximo campo
                const nextInput = findNextInput(this);
                if (nextInput) nextInput.focus();
            }
        });
    });
    
    // Configuração dos campos de data (apenas números)
    const dataInputs = document.querySelectorAll('.date-input input');
    dataInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            
            // Validação para dia (1-31), mês (1-12) e ano
            if (this.id === 'data-dia' && this.value.length === 2) {
                const dia = parseInt(this.value);
                if (dia < 1) this.value = '01';
                if (dia > 31) this.value = '31';
                
                // Move para o próximo campo (mês)
                document.getElementById('data-mes').focus();
            }
            
            if (this.id === 'data-mes' && this.value.length === 2) {
                const mes = parseInt(this.value);
                if (mes < 1) this.value = '01';
                if (mes > 12) this.value = '12';
                
                // Move para o próximo campo (ano)
                document.getElementById('data-ano').focus();
            }
            
            if (this.id === 'data-ano' && this.value.length === 4) {
                // Move para o próximo campo
                const nextInput = findNextInput(this);
                if (nextInput) nextInput.focus();
            }
        });
    });
    
    // Configuração do campo de telefone (apenas números)
    const telefoneInputs = document.querySelectorAll('.phone-input input');
    telefoneInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            
            if (this.id === 'telefone-ddd' && this.value.length === 2) {
                // Move para o próximo campo (número)
                document.getElementById('telefone-numero').focus();
            }
        });
    });
    
    // Função para encontrar o próximo input
    function findNextInput(currentInput) {
        const formElements = Array.from(document.querySelectorAll('input, textarea, select'));
        const currentIndex = formElements.indexOf(currentInput);
        
        if (currentIndex !== -1 && currentIndex < formElements.length - 1) {
            return formElements[currentIndex + 1];
        }
        
        return null;
    }
    
    // Configuração para limpar o formulário
    document.getElementById('limpar-form').addEventListener('click', function() {
        if (confirm('Tem certeza que deseja limpar todos os campos do formulário?')) {
            document.getElementById('relatorio-form').reset();
            clearSignatures();
        }
    });
    
    // Configuração para salvar como PDF
    document.getElementById('salvar-pdf').addEventListener('click', function() {
        // Esconde os botões temporariamente para o PDF
        const buttonContainer = document.querySelector('.button-container');
        const buttonDisplayStyle = buttonContainer.style.display;
        buttonContainer.style.display = 'none';
        
        // Captura o formulário como imagem
        html2canvas(document.querySelector('.container')).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Calcula as dimensões para ajustar ao tamanho A4
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            
            // Adiciona a primeira página
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            // Adiciona páginas adicionais se necessário
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            // Salva o PDF
            pdf.save('Relatório_de_Atendimento_ao_Cliente.pdf');
            
            // Restaura os botões
            buttonContainer.style.display = buttonDisplayStyle;
        });
    });
    
    // Inicializa os canvas para assinatura
    setupSignatureCanvas('assinatura-local', 'clear-local');
    setupSignatureCanvas('assinatura-tecnico', 'clear-tecnico');
});

// Função para configurar o canvas de assinatura
function setupSignatureCanvas(canvasId, clearButtonId) {
    const canvas = document.getElementById(canvasId);
    const clearButton = document.getElementById(clearButtonId);
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    // Ajusta o tamanho do canvas para corresponder ao tamanho exibido
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
    }
    
    // Inicializa o canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Funções de desenho
    function startDrawing(e) {
        isDrawing = true;
        [lastX, lastY] = getCoordinates(e);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        
        const [currentX, currentY] = getCoordinates(e);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        
        [lastX, lastY] = [currentX, currentY];
    }
    
    function stopDrawing() {
        isDrawing = false;
    }
    
    // Obtém as coordenadas do mouse ou toque
    function getCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        if (e.type.includes('touch')) {
            return [
                (e.touches[0].clientX - rect.left) * scaleX,
                (e.touches[0].clientY - rect.top) * scaleY
            ];
        } else {
            return [
                (e.clientX - rect.left) * scaleX,
                (e.clientY - rect.top) * scaleY
            ];
        }
    }
    
    // Limpa o canvas
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Adiciona os event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Suporte para dispositivos touch
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    
    // Botão para limpar
    clearButton.addEventListener('click', clearCanvas);
    
    // Retorna a função para limpar o canvas (usada pelo botão de limpar formulário)
    return clearCanvas;
}

// Função para limpar todas as assinaturas
function clearSignatures() {
    const canvases = document.querySelectorAll('.signature-pad');
    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
}

// Preenche a data atual automaticamente
document.addEventListener('DOMContentLoaded', function() {
    const hoje = new Date();
    const dia = hoje.getDate().toString().padStart(2, '0');
    const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
    const ano = hoje.getFullYear();
    
    if (document.getElementById('data-dia')) {
        document.getElementById('data-dia').value = dia;
        document.getElementById('data-mes').value = mes;
        document.getElementById('data-ano').value = ano;
    }
});
