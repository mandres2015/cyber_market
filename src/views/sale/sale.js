// COMPRAS
const { ipcRenderer } = require("electron");
const { data } = require("jquery");
let $ = require("jquery");
require("popper.js");
require("bootstrap");
require("bootstrap-select");

function tableEmpty() {
  const table = document.getElementById("productsTable");
  let tbody = table.getElementsByTagName("tbody")[0];

  if (tbody.rows.length === 0) {
    let columns = table.rows[0].cells.length;
    let row = tbody.insertRow();
    let cell = row.insertCell(0);
    cell.innerHTML = "No hay productos agregados";
    cell.colSpan = columns;
    // tr.appendChild(document.createElement);
  }
}

function cleanTable() {
  const table = document.getElementById("productsTable");
  let tbody = table.getElementsByTagName("tbody")[0];

  for (let i = 0; i < tbody.rows.length; i++) {
    const row = tbody.rows[i];
    tbody.deleteRow(row);
  }
  if (tbody.rows.length === 0) {
    tableEmpty();
  }
}

cleanTable();

// !MOSTRAR LISTA DE CLIENTES
const searchClient = document.querySelector("#client");
searchClient.addEventListener("keyup", getClients);

async function getClients() {
  const searchValue = searchClient.value;
  console.log(searchValue);

  if (searchValue.length >= 3) {
    console.log("Esperando 1");

    const params = [searchValue];

  ipcRenderer.send("getClients", params);
  }
  //    else {
  //     showProducts();
  //   }
}

ipcRenderer.on("sendClients", (e, response) => {
  console.log(e);
  console.log(response);
  clients = response.data;
  addClientsToSelect(clients);
});

function addClientsToSelect(data) {
  document.querySelector("#clientsList").innerHTML = "";
  data.forEach((element) => {
    let li = document.createElement("li");
    li.className = "list-group-item";
    li.appendChild(
      document.createTextNode(element.first_name + " " + element.last_name)
    );
    li.setAttribute("id", "prod" + element.id); // added line
    li.setAttribute("tabindex", 0); // added line
    li.setAttribute("class", "prod"); // added line
    li.addEventListener("click", fillClient);
    li.addEventListener("keyup", fillClient);
    document.querySelector("#clientsList").appendChild(li);
  });
}

function cleanClientFields() {
  document.getElementById("idClient").innerHTML = "";
  document.getElementById("nameClient").innerHTML = "";
}

function fillClient(e) {
  if (e.type == "click" || e.keyCode == 32 || e.keyCode == 13) {
    console.log(e.target.innerHTML);
    const nodes = Array.from(e.target.closest("ul").children);
    const i = nodes.indexOf(e.target);
    cleanClientFields();
    const client = document.querySelector("#nameClient");
    const id = document.querySelector("#idClient");
    id.value = e.target.id.split("prod")[1];
    id.className = "hover-focus";
    client.value = e.target.innerHTML;
    client.className = "hover-focus";
    let productsList = document.querySelector("#clientsList");
    productsList.innerHTML = "";
    searchClient.value = "";
    document.querySelector("#clientsList").innerHTML = "";
  }
}
