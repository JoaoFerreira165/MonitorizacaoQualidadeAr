import { criarMenu, menuItens } from "/meteo/menu/menuFunction.js";
import { ActualPage } from "/meteo/menu/ActualPage.js";
import { InfoTowersAll, InfoTowersById, InfoAllByTorresId, InfoTorres, InfoVariaveisId } from '/meteo/scripts/getDados.js';

//teste2
var url = window.location.href;
var pagina = url.substring(url.indexOf('index'));
console.log("xx")
document.getElementById("Pagina-Atual").innerHTML = await ActualPage("icon_info.png", "", "Dashboard");
document.getElementById("sidebar-nav").innerHTML = criarMenu(menuItens, "dashboard", pagina);
let startDate = document.getElementById("start-date");
let endDate = document.getElementById("end-date");
//Atualizar dados
$(document).ready(function () {
    $('.ActualData').on('click', function () {
        console.log("x");
        console.log(startDate.value);
        console.log(endDate.value);
    });
});
//Atualizar Pagina
$(document).ready(function () {
    $('.ReloadPage').on('click', function () {
        window.location.reload(true);
    });
});
let allTowers = await InfoTorres();
var conteudo = document.getElementById("conteudo");
conteudo.removeAttribute("hidden");

// Mapear os dados para um objeto onde a chave é o id_torre
const torresMap = allTowers.data.reduce((acc, curr) => {
    if (!acc[curr.id_torre]) {
        acc[curr.id_torre] = [];
    }
    acc[curr.id_torre].push({ id_variavel: curr.id_variavel, torres_id: curr.torres_id });
    return acc;
}, {});

const container = document.getElementById('app');

async function createCards() {
    // Adicionar uma classe de container flexível
    const flexContainer = document.createElement('div');
    flexContainer.className = 'd-flex flex-row';

    for (const id_torre of Object.keys(torresMap)) {
        console.log(torresMap)
        let infoTowers = await InfoTowersById(id_torre);
        console.log(infoTowers);
        if (infoTowers.data[0].activa == 1) {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card m-2';

            const cardHeader = document.createElement('div');
            cardHeader.className = 'card-header';
            cardHeader.innerText = `${infoTowers.data[0].nome}`;

            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';

            async function createButton(torres_id) {
                console.log(torres_id);
                let valueVariable = await InfoAllByTorresId(torres_id);
                const button = document.createElement('button');
                button.className = 'btn btn-primary m-1'; // Adicionar margem entre botões
                button.innerText = `${valueVariable.data[0].nomeVariavel}`;

                // Adicionar um evento de clique que redireciona para um novo caminho
                button.addEventListener('click', () => {
                    const newPath = `./geral/${valueVariable.data[0].ficheiro}.html?torre_Id=${id_torre}&variavel_Id=${valueVariable.data[0].torres_id}`;
                    window.location.href = newPath;
                });

                cardBody.appendChild(button);
            }

            // Iterar sobre as variáveis dessa torre e criar botões
            for (const { id_variavel, torres_id } of torresMap[id_torre]) {
                await createButton(torres_id);
            }

            cardDiv.appendChild(cardHeader);
            cardDiv.appendChild(cardBody);
            flexContainer.appendChild(cardDiv); // Adicionar o card ao contêiner flexível
        }
    }

    container.appendChild(flexContainer); // Adicionar o contêiner flexível ao contêiner principal
}

// Chame a função assíncrona
createCards();
