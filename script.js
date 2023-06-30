// Variáveis globais
var iframeDocument = null;
var iframe = null;
var setupListeners = true;
var segundoExecucao = 0;
var timer = null;
var estadoSimulacaoRodando = false;
var setupEfetuado = false;
var versaoGrafico = "1";

// Função chamada quando o arquivo é selecionado
function handleFileSelect(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const htmlContent = event.target.result;
    iframe = document.getElementById('janelaSimulacao');

    iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    iframeDocument.open();
    iframeDocument.write(htmlContent);
    iframeDocument.close();

    document.getElementById("configuracao").style.display = "block";
    const configurationSection = document.getElementById('configuracao');
    configurationSection.classList.remove('hidden');
    executarAudio(`Simulação carregada com sucesso!`);
    const divGrafico = iframeDocument.getElementsByClassName('netlogo-plot')[0];
    versaoGrafico = divGrafico.getAttribute('data-highcharts-chart');
  };

  reader.readAsText(file);
}

// Função que será executada a cada segundo
function pegarDados() {
  if (!iframeDocument) return;

  if (emExecucao()) {
    segundoExecucao++;
    try {
      const intervaloSegundos = parseInt(document.getElementById('intervaloSegundos').value);
      if (segundoExecucao % intervaloSegundos === 0) {
        executarMonitoramento();
      }
    } catch (error) {
      alert("Erro ao executar o monitoramento. Verifique se o valor de segundos para execução está correto.");
    }
  }
}

// Executa o monitoramento e reproduz a resposta em áudio
function executarMonitoramento() {
  try {
    const situacaoAgentes = iframe.contentWindow.BreedManager.breeds();
    const nomesAgentes = Object.keys(situacaoAgentes);
    var textoInformativo = "Contagem: ";
    const somaEnergia = iframe.contentWindow.world._patches.reduce((acumulador, objeto) => acumulador + objeto._varManager["countdown"], 0);
    var dadosParaSalvar = [0 ,0 ,0, 0];

// converte raças para português
const racas = {
  sheep: "gafanhoto",
  wolves: "passarinho"
  // Adicione mais raças aqui, se necessário
};

    for (const nomeAgente of nomesAgentes) {
      if (nomeAgente !== "LINKS" && nomeAgente !== "TURTLES") {
        const { originalName, members } = situacaoAgentes[nomeAgente];
      const raca = racas[originalName] || originalName; // Obtém o nome da raça em português, ou usa o nome original se não houver tradução disponível
        textoInformativo += `: ${raca} contém ${members.length} ${members.length != 1 ? 'membros' : 'membro'}`;
        if (originalName == "sheep") {
          dadosParaSalvar[1] = members.length;
        } else {
          dadosParaSalvar[2] = members.length;
        }

      }
    }
    textoInformativo += `. Energia total ${Math.floor(somaEnergia)}.`;
    dadosParaSalvar[3] = Math.floor(somaEnergia);
    executarAudio(textoInformativo);
    // salvar informação no textArea
    var textoParaSalvar = document.getElementById("arquivoDownload").value;
    if (textoParaSalvar == "") {
        textoParaSalvar += "segundo;gafanhoto;passarinho;energia\n";
    }
    textoParaSalvar += `\n${segundoExecucao};${dadosParaSalvar[1]};${dadosParaSalvar[2]};${dadosParaSalvar[3]}`;
    document.getElementById("arquivoDownload").value = textoParaSalvar;
  } catch (error) {
    console.log(error);
  }
  
}

// Reproduz a resposta em áudio
function executarAudio(texto) {
  try {
    const speech = new SpeechSynthesisUtterance(texto);
    speech.lang = 'pt-BR';
    speech.rate = 1.4; // Aumenta a velocidade em 40%
    window.speechSynthesis.speak(speech);
  } catch (error) {
    alert("Seu navegador não dá suporte a áudio.");
  }
}

// Verifica se a simulação está em execução
function emExecucao() {
  if (!iframeDocument) return false;

  const elements = iframeDocument.getElementsByClassName('netlogo-forever-button');
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (element.classList.contains('netlogo-active')) {
      if (!estadoSimulacaoRodando) {
        executarAudio(`Iniciando simulação. contagem a cada ${parseInt(document.getElementById('intervaloSegundos').value)} segundos`);
        estadoSimulacaoRodando = true;
      }
      return true;
    }
    if (!element.classList.contains('netlogo-disabled') && !setupEfetuado) {
        setupEfetuado = true;
        executarAudio(`Simulação ativada com sucesso.`);
        const divGrafico = iframeDocument.getElementsByClassName('netlogo-plot')[0];
        versaoGrafico = divGrafico.getAttribute('data-highcharts-chart');
    }
  }
  const divGrafico = iframeDocument.getElementsByClassName('netlogo-plot')[0];
  if (versaoGrafico != divGrafico.getAttribute('data-highcharts-chart')){
      executarAudio(`Setup da simulação executado com sucesso.`);
      versaoGrafico = divGrafico.getAttribute('data-highcharts-chart');
  }
  


  if (estadoSimulacaoRodando) {
    executarAudio("Pausando simulação");
    estadoSimulacaoRodando = false;
  }
  return false;
}

// Inicia o timer para pegar dados a cada segundo
function iniciarMonitoramento() {
  if (timer) return;
  timer = setInterval(pegarDados, 1000);
}

// Para o timer de monitoramento
function pararMonitoramento() {
  clearInterval(timer);
  timer = null;
}

// Realiza o download o texto do TextArea
function downloadTexto() {
  const textarea = document.getElementById('arquivoDownload');
  const texto = textarea.value;
  
  // Cria um elemento de link
  const link = document.createElement('a');
  link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(texto);
  link.download = 'simulacao.csv';
  
  // Simula um clique no link para iniciar o download
  link.click();
}

// Event listener para o botão de seleção de arquivo
document.getElementById('arquivoSimulacao').addEventListener('change', handleFileSelect);
document.getElementById('botaoDownload').addEventListener('click', downloadTexto);

iniciarMonitoramento();