import { criarMenu, menuItens } from '/meteo/menu/menuFunction.js';
import { ActualPage } from '/meteo/menu/ActualPage.js';
import { dataIntervalDias, dataIntervalMinutos, InfoAllByMeteobaseId, InfoAllByMeteobaseIdAndTorresId, InfoAllByTorresId, InfoReadVariaveisById, InfoReadVariaveisByName } from '/meteo/scripts/getDados.js';
import { checkData, normalizeData, checkConteudo, createTable, addData, createTableShowData, DataMediaSeconds, createCompareDiv, creatBodyModal, graficos, chartjs, ResetZoom, setDateInputs, creatBodyModalMostrarMaisDados, distime, checkDados, refreshOtherTowers, addGraph, refreshOtherTowersByDate, exportToCSV, convertHTMLtoPDF2 } from '/meteo/scripts/function.js';

var url = window.location.href;
var x = new URL(url)
const params = new URLSearchParams(x.search);
const torreId = params.get("torre_Id");
const variavelId = params.get("variavel_Id");
console.log("Torre:", torreId);
console.log("Variável:", variavelId);
let infos1torreVar = await InfoAllByMeteobaseIdAndTorresId(torreId, variavelId);
if (infos1torreVar.data.length == 0) {
    window.location.href = "/meteo/errorPage/error_page.html";
}
let intervaloAtuali;

document.querySelectorAll('.dropdown-itemFiltro').forEach(function (item) {
    item.addEventListener('click', function () {
        document.querySelectorAll('.dropdown-itemFiltro').forEach(function (item) {
            item.classList.remove('active');
        });
        this.classList.add('active');
    });
});
let valueRefresh = 15000;
document.querySelectorAll('.dropdown-itemRefresh').forEach(function (item) {
    item.addEventListener('click', async function () {
        document.querySelectorAll('.dropdown-itemRefresh').forEach(function (item) {
            item.classList.remove('active');
        });
        this.classList.add('active');
        valueRefresh = parseInt(this.getAttribute('value'));
        if (valueRefresh === NaN) {
            clearInterval(intervaloAtuali);
        }
        else {
            clearInterval(intervaloAtuali);
            intervaloAtuali = setInterval(atualizarGraf, valueRefresh);
        }
        await atualizarGraf();
    });
});
var pathname = x.pathname;
var filename = pathname.split('/').pop();
if (filename == infos1torreVar.data[0].ficheiro + ".html") {
}
else {
    filename = infos1torreVar.data[0].ficheiro + ".html"; // Define o novo nome do arquivo
    var newURL = `/meteo/geral/${filename}?torre_Id=${torreId}&variavel_Id=${variavelId}`;
    window.location.href = newURL; // Redireciona para a nova 
}
//let infosVariaveisById = await InfoReadVariaveisById(infos1torreVar.data[0].id_variavel);
let infosVariaveisByName = await InfoReadVariaveisByName(infos1torreVar.data[0].nomeVariavel2, infos1torreVar.data[0].id_variavel);
var nomeTorre = infos1torreVar.data[0].nome;
var variavel = infos1torreVar.data[0].nomeVariavel;
var IconVariavel = infos1torreVar.data[0].icon;
var nomeTorreBaseDados = infos1torreVar.data[0].torreAssoc;
let nomeVariavelBaseDados = infos1torreVar.data[0].NomeBaseDados;
var nomeTorreAtual = infos1torreVar.data[0].nomeTorre;
let grandeza = infos1torreVar.data[0].grandeza;
let intervalo = 60;
let minutos = 180;
let comIntervalo = true;
let tempoMinutos = false;
var divForCompare = "divCompare";
var pagina = url.substring(url.indexOf('/meteo'));
document.getElementById("sidebar-nav").innerHTML = criarMenu(menuItens, infos1torreVar.data[0].nomeTorre, pagina);
document.getElementById("Pagina-Atual").innerHTML = await ActualPage(IconVariavel, nomeTorre, variavel);
document.getElementById("TitulovariavelGrafico").innerHTML = variavel;
document.getElementById("TitulovariavelNoData").innerHTML = variavel;
var conteudo = document.getElementById("conteudo");
var gif = document.getElementById("gif");
let dateStart = document.getElementById("start-date");
let dateFinish = document.getElementById("end-date");
dateStart.max = new Date().toISOString().slice(0, new Date().toISOString().lastIndexOf(":"));
dateFinish.max = new Date().toISOString().slice(0, new Date().toISOString().lastIndexOf(":"));
let modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('myModal'))
let modalMaisDados = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalMostrarDados'))
let InsertDataIntervalModal = document.getElementById('LastTimeRefreshedModal');
let InsertDataIntervalModalMaisDados = document.getElementById('LastTimeRefreshedModalMaisDados');
let dados;
graficos(variavel)
checkConteudo();
let gauge;
let defs1;
defs1 = {
    min: 0,
    max: 100,
    decimals: 2,
    symbol: grandeza,
    pointer: true,
    minLabelMinFontSize: 14,
    maxLabelMinFontSize: 14,
    pointerOptions: {
        toplength: -15,
        bottomlength: 10,
        bottomwidth: 12,
        color: '#8e8e93',
        stroke: '#ffffff',
        stroke_width: 3,
        stroke_linecap: 'round'
    },
    gaugeWidthScale: 0.9,
    counter: true,
}
let graficoGauge = false;
let dados2;
let dadosNormaOntem;
var linhaOntem = false;
createCompareDiv(divForCompare, nomeTorreAtual, infosVariaveisByName.data);
document.getElementById("MaxAndMin").innerHTML = `Máximos e Mínimos ${grandeza} `;
var toggleButton = document.getElementById("toggle-line");
toggleButton.addEventListener("click", toggleNewLine);
async function getDadosOntem(start, end) {
    var dateStartNorm = new Date(start.value)
    var dateEndNorm = new Date(end.value)
    dateStartNorm.setDate(dateStartNorm.getDate() - 1)
    dateEndNorm.setDate(dateEndNorm.getDate() - 1)

    dados2 = await dataIntervalDias(nomeTorreBaseDados, nomeVariavelBaseDados, dateStartNorm.toISOString(), dateEndNorm.toISOString());
    dados2 = normalizeData(dados2.data, 0, 100);

    var dado1Graf = addGraph(dados2, intervalo, comIntervalo, tempoMinutos)
    for (let i = 0; i < dado1Graf.length; i++) {
        var date = new Date(dado1Graf[i].x)
        date.setDate(date.getDate() + 1);
        dado1Graf[i].x = date.toISOString();
    }
    return dado1Graf;
}
async function getDadosMinutos() {
    setDateInputs(0, 0, minutos);
    dados = await dataIntervalMinutos(nomeTorreBaseDados, nomeVariavelBaseDados, minutos);
    console.log(dados)
    var x = checkDados(dados);
    if (x) {
        clearInterval(intervaloAtuali);
        document.querySelectorAll('.dropdown-itemRefresh').forEach(function (item) {
            item.classList.remove('active');
        });
        document.getElementById("desativarFiltro").classList.add('active');
        return;
    }
    else {
        dados = normalizeData(dados.data, 0, 100);
        dadosNormaOntem = await getDadosOntem(dateStart, dateFinish);
        distime();
        chartjs.destroy();
        graficos(variavel);
        checkData(dados, chartjs, comIntervalo, intervalo, tempoMinutos);
        ResetZoom();
        checkConteudo();
        createTable(dados, variavel, "tabelaEstatis", grandeza);
        createTableShowData(dados, "tabelaMostrarDados", grandeza)
        refreshOtherTowers(infosVariaveisByName, nomeTorreAtual, 5, grandeza);
        gauge = new JustGage({
            id: "gauge",
            value: 0,
            defaults: defs1
        });
        graficoGauge = true;
        if (dados.length == 0) {
            gauge.destroy();
            graficoGauge = false;
            return;
        }
        else {
            graficoGauge = true;
            gauge.refresh(dados[dados.length - 1].value.toFixed(3));
        }
        intervaloAtuali = setInterval(atualizarGraf, valueRefresh);
    }
}
getDadosMinutos();
function addLinetoGraph(data) {
    chartjs.data.datasets.push({
        label: ` ${variavel}(dia Anterior)`,
        data: data,
        borderColor: "gray",
        fill: false,
        spanGaps: true,
        showLine: false,
    });
}
function toggleNewLine() {
    var newLineIndex = chartjs.data.datasets.length;
    if (newLineIndex === 1) {
        addLinetoGraph(dadosNormaOntem);
        linhaOntem = true;
    } else {
        chartjs.data.datasets.splice(newLineIndex - 1, 1);
        linhaOntem = false;
    }
    chartjs.update();
}
async function atualizarGraf() {
    setDateInputs(0, 0, minutos);
    var dateStartNorm = new Date(dateStart.value);
    var dateEndNorm = new Date();
    dados = await dataIntervalDias(nomeTorreBaseDados, nomeVariavelBaseDados, dateStartNorm.toISOString(), dateEndNorm.toISOString());

    dadosNormaOntem = await getDadosOntem(dateStart, dateFinish);
    var x = checkDados(dados);
    if (x) {
        clearInterval(intervaloAtuali);
        document.querySelectorAll('.dropdown-itemRefresh').forEach(function (item) {
            item.classList.remove('active');
        });
        document.getElementById("desativarFiltro").classList.add('active');
        return;
    }
    else {
        dados = normalizeData(dados.data, 0, 100);

        ResetZoom()
        chartjs.destroy();
        graficos(variavel);
        addData(dados, chartjs, comIntervalo, intervalo, tempoMinutos);
        if (linhaOntem) {
            addLinetoGraph(dadosNormaOntem)
            chartjs.update();
        }
        createTable(dados, variavel, "tabelaEstatis", grandeza);
        ResetZoom();
        distime();
        gauge.refresh(dados[dados.length - 1].value.toFixed(3));
        refreshOtherTowers(infosVariaveisByName, nomeTorreAtual, minutos, grandeza);
    }
}
let diffInMinutes;
function timeInMinutes(start, end) {
    var dateStart = new Date(start);
    var dateEnd = new Date(end);
    var diffInMilliseconds = dateEnd - dateStart;
    return diffInMinutes = Math.floor(diffInMilliseconds / 60000);
}
async function getDadosData(start, end) {
    conteudo.setAttribute("hidden", true);
    gif.removeAttribute("hidden");
    minutos = timeInMinutes(start, end);
    var dateStartNorm = new Date(start);
    var dateEndNorm = new Date(end)
    dados = await dataIntervalDias(nomeTorreBaseDados, nomeVariavelBaseDados, dateStartNorm.toISOString(), dateEndNorm.toISOString());
    var x = checkDados(dados);
    if (x) {
        document.querySelectorAll('.dropdown-itemRefresh').forEach(function (item) {
            item.classList.remove('active');
        });
        document.getElementById("desativarFiltro").classList.add('active');
        return;
    }
    else {
        dados = normalizeData(dados.data, 0, 100);
        chartjs.destroy();
        graficos(variavel);
        if (minutos > 600) {
            tempoMinutos = true;
            intervalo = 15;
        }
        else {
            tempoMinutos = false;
        }
        dadosNormaOntem = await getDadosOntem(dateStart, dateFinish);
        await checkData(dados, chartjs, comIntervalo, intervalo, tempoMinutos);
        ResetZoom();
        createTable(dados, variavel, "tabelaEstatis", grandeza);
        createTableShowData(dados, "tabelaMostrarDados", grandeza)
        if (linhaOntem) {
            addLinetoGraph(dadosNormaOntem);
            chartjs.update();
        }
        if (graficoGauge) {
            gauge.refresh(dados[dados.length - 1].value.toFixed(3));
        } else {
            gauge = new JustGage({
                id: "gauge",
                value: 0,
                defaults: defs1
            });
            gauge.refresh(dados[dados.length - 1].value.toFixed(3));
            graficoGauge = true;
        }
        distime();
        refreshOtherTowersByDate(infosVariaveisByName, nomeTorreAtual, dateStartNorm.toISOString(), dateEndNorm.toISOString(), grandeza, nomeVariavelBaseDados, 0, 100);
        gif.setAttribute("hidden", true);
        conteudo.removeAttribute("hidden");
        dateStart.value = start;
        dateFinish.value = end;
    }
}
$(document).ready(function () {
    $('#ResetZoom').on('click', function () {
        ResetZoom();
    })
});
$(document).ready(function () {
    $('.ActualData').on('click', async function () {
        if (dateStart.value === dateFinish.value) {
            $('#myModalInfo').modal('show');
            $('.modal_body1').html('Datas iguais!!<br> A data Inicial tem de ser diferente da data Final!');
            return;
        }
        if (dateStart.value == "" || dateFinish.value == "") {
            $('#myModalInfo').modal('show');
            $('.modal_body1').html('Tem de selecionar um intervalo de Tempo!');
            return;
        }
        conteudo.setAttribute("hidden", true);
        chartjs.destroy();
        graficos(variavel);
        await getDadosData(dateStart.value, dateFinish.value);
    })
});
async function refreshConteudo() {
    gif.removeAttribute("hidden");
    conteudo.setAttribute("hidden", true);
    dados = await dataIntervalMinutos(nomeTorreBaseDados, nomeVariavelBaseDados, minutos);
    var x = checkDados(dados);
    if (x) {
        clearInterval(intervaloAtuali);
        document.querySelectorAll('.dropdown-itemRefresh').forEach(function (item) {
            item.classList.remove('active');
        });
        document.getElementById("desativarFiltro").classList.add('active');
        return;
    }
    else {
        dados = normalizeData(dados, 0, 100);
        distime();
        chartjs.destroy();
        graficos(variavel);
        ResetZoom();
        createTable(dados, variavel, "tabelaEstatis", grandeza);
        createTableShowData(dados, "tabelaMostrarDados", grandeza)
        checkData(dados, chartjs, comIntervalo, intervalo, tempoMinutos);
        dadosNormaOntem = await getDadosOntem(dateStart, dateFinish);
        if (linhaOntem) {
            addLinetoGraph(dadosNormaOntem)
            chartjs.update();
        }
        if (graficoGauge) {
            gauge.refresh(dados[dados.length - 1].value.toFixed(3));
        } else {
            gauge = new JustGage({
                id: "gauge",
                value: 0,
                defaults: defs1
            });
            gauge.refresh(dados[dados.length - 1].value.toFixed(3));
            graficoGauge = true;
        }
        refreshOtherTowers(infosVariaveisByName, nomeTorreAtual, minutos, grandeza);
        gif.setAttribute("hidden", true);
        conteudo.removeAttribute("hidden");
    }
}
$(document).ready(function () {
    $('.updateChart1h').on('click', async function () {
        minutos = 60;
        setDateInputs(0, 1, 0);
        tempoMinutos = false;
        refreshConteudo()
    })
});
$(document).ready(function () {
    $('.updateChart3h').on('click', async function () {
        minutos = 180;
        setDateInputs(0, 3, 0);
        tempoMinutos = false;

        refreshConteudo()
    })
});
$(document).ready(function () {
    $('.updateChart6h').on('click', async function () {
        minutos = 6 * 60;
        setDateInputs(0, 6, 0);
        tempoMinutos = false;
        refreshConteudo()
    })
});
$(document).ready(function () {
    $('.updateChart12h').on('click', async function () {
        minutos = 12 * 60;
        setDateInputs(0, 12, 0);
        tempoMinutos = true;
        intervalo = 5;
        refreshConteudo()

    })
});
$(document).ready(function () {
    $('.updateChartToday').on('click', async function () {
        var date = new Date();
        minutos = (date.getHours() * 60) + date.getMinutes();
        setDateInputs(0, date.getHours(), date.getMinutes());
        tempoMinutos = true;
        intervalo = 5;
        refreshConteudo()

    })
});
$(document).ready(function () {
    $('.updateChartWeek').on('click', async function () {
        minutos = 7 * 24 * 60;
        setDateInputs(7, 0, 0);
        tempoMinutos = true;
        intervalo = 60;
        refreshConteudo()
    })
});
$(document).ready(function () {
    $('.updateChartMonth').on('click', async function () {
        minutos = 31 * 24 * 60;
        setDateInputs(31, 0, 0);
        tempoMinutos = true;
        intervalo = 60;
        refreshConteudo()
    })
});
for (let i = 0; i < infosVariaveisByName.data.length; i++) {
    if (infosVariaveisByName.data[i].nomeTorre != nomeTorreAtual && infosVariaveisByName.data[i].nomeVariavel != "Dashboard" && infosVariaveisByName.data[i].activa == 1) {
        let btn = document.getElementById(`abrirModal${i}`);
        var dateStartNorm = new Date(dateStart.value);
        var dateEndNorm = new Date(dateFinish.value);
        let dataTorreCompare = await dataIntervalDias(btn.getAttribute('data3'), btn.getAttribute('data4'), dateStartNorm.toISOString(), dateEndNorm.toISOString());
        $(document).ready(function () {
            $(`#abrirModal${i}`).on('click', async function () {
                creatBodyModal(btn.getAttribute('data'), btn.getAttribute('data2'), dados, dataTorreCompare.data);
                const dataStart = dateStart.value.split('T');
                const dataFinish = dateFinish.value.split('T');
                InsertDataIntervalModal.innerHTML = "Entre - " + dataStart[0] + " " + dataStart[1] + " e " + dataFinish[0] + " " + dataFinish[1];
                modal.show();
            })
        });
    }
}
$(document).ready(function () {
    $(`#abrirModalMaisDados`).on('click', async function () {
        creatBodyModalMostrarMaisDados(nomeTorre, dados, 5, grandeza)
        const dataStart = dateStart.value.split('T');
        const dataFinish = dateFinish.value.split('T');
        InsertDataIntervalModalMaisDados.innerHTML = "Entre - " + dataStart[0] + " " + dataStart[1] + " e " + dataFinish[0] + " " + dataFinish[1];
        modalMaisDados.show();
    })
});
$(document).ready(function () {
    $('.ReloadPage').on('click', function () {
        window.location.reload(true);
    })
})
$(document).keyup(function (e) {
    if ((e.key == 'Escape' || e.key == 'Esc' || e.keyCode == 27)) {
        modal.hide();
    }
})
$(document).ready(function () {
    $('#btnExportToCsv').on('click', async function () {
        exportToCSV(dados, nomeTorre, variavel, grandeza);
    })
})
$(document).ready(function () {
    $('#btnExportToPdf').on('click', async function () {
        convertHTMLtoPDF2(dados, nomeTorre, variavel, grandeza);
    })
})
