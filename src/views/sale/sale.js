// COMPRAS
const { ipcRenderer } = require("electron");
const { data, each } = require("jquery");
let $ = require("jquery");
require("popper.js");
require("bootstrap");
require("bootstrap-select");

const IVA = 12;

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
}

cleanTable();
tableEmpty();

function cleanFields(id) {
  const inputs = document.getElementById(id).getElementsByTagName("input");
  // console.log(block);
  for (const input of inputs) {
    if (input.type === "checkbox") {
      input.checked = false;
    }
    if (input.type !== "button" || input.type !== "submit") {
      input.value = "";
      input.innerHTML = "";
    }
    input.classList.remove("hover-focus");
  }
}

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
    li.appendChild(document.createTextNode(element.first_name + " " + element.last_name));
    li.setAttribute("id", "cli" + element.id); // added line
    li.setAttribute("tabindex", 0); // added line
    li.setAttribute("class", "prod"); // added line
    li.addEventListener("click", fillClient);
    li.addEventListener("keyup", fillClient);
    document.querySelector("#clientsList").appendChild(li);
  });
}

function fillClient(e) {
  if (e.type == "click" || e.keyCode == 32 || e.keyCode == 13) {
    console.log(e.target.innerHTML);
    const nodes = Array.from(e.target.closest("ul").children);
    const i = nodes.indexOf(e.target);
    cleanFields("clientBlock");
    const client = document.querySelector("#nameClient");
    const id = document.querySelector("#idClient");
    id.value = e.target.id.split("cli")[1];
    id.className = "hover-focus";
    client.value = e.target.innerHTML;
    client.className = "hover-focus";
    let productsList = document.querySelector("#clientsList");
    productsList.innerHTML = "";
    searchClient.value = "";
    document.querySelector("#clientsList").innerHTML = "";
  }
}

// !MOSTRAR LISTA DE PRODUCTOS
document.querySelector("#searchProduct").addEventListener("keyup", getProducts);
document.querySelector("#searchProduct").addEventListener(
  "focus",
  () => {
    document.querySelector("#productsList").style.display = "block";
  },
  false
);

function getProducts() {
  const searchValue = document.querySelector("#searchProduct").value;
  console.log(searchValue);

  if (searchValue.length > 0) {
    console.log("Esperando 1");

    const params = [searchValue];

    ipcRenderer.send("getProducts", params);
  } else {
    document.querySelector("#productsList").innerHTML = "";
  }
  //    else {
  //     showProducts();
  //   }
}

ipcRenderer.on("sendProducts", (e, response) => {
  console.log(e);
  console.log(response);
  clients = response.data;
  addProductsToSelect(clients);
});

function addProductsToSelect(data) {
  document.querySelector("#productsList").innerHTML = "";
  data.forEach((element) => {
    let productName = "";
    if (element.is_product != true) {
      productName = element.name + " - " + element.entity;
    } else {
      productName = element.name + " - " + element.brand;
    }
    let li = document.createElement("li");
    li.className = "list-group-item";
    li.appendChild(document.createTextNode(productName));
    li.setAttribute("id", "cli" + element.code); // added line
    li.setAttribute("tabindex", 0); // added line
    li.setAttribute("class", "prod"); // added line
    li.addEventListener(
      "click",
      (evt) => {
        fillProduct(evt, element);
      },
      false
    );
    li.addEventListener(
      "keyup",
      (evt) => {
        fillProduct(evt, element);
      },
      false
    );
    document.querySelector("#productsList").appendChild(li);
    li.addEventListener(
      "focus",
      () => {
        document.querySelector("#productsList").style.display = "block";
      },
      false
    );
  });
}

function fillProduct(e, product) {
  console.log(product);
  const tbody = document.getElementById("productsTable").getElementsByTagName("tbody")[0];
  if (e.type == "click" || e.keyCode == 32 || e.keyCode == 13) {
    const columnsTable = {
      colCode: 0,
      colProduct: 1,
      colStock: 2,
      colQty: 3,
      colUnitPrice: 4,
      colIva: 5,
      colDesc: 6,
      colDescPerc: 7,
      colAdds: 8,
      colActions: 9,
    };

    if (tbody.rows[0].cells[0].colSpan > 1) {
      cleanTable();
    }
    let row = tbody.insertRow();
    let input;
    for (const col in columnsTable) {
      let cell = row.insertCell(columnsTable[col]);
      cell.className = "cell-table"
      switch (columnsTable[col]) {
        case columnsTable.colCode:
          cell.innerHTML = product.id;
          break;
        case columnsTable.colProduct:
          cell.innerHTML = product.name;
          break;
        case columnsTable.colStock:
          cell.innerHTML = product.stock;
          break;
        case columnsTable.colQty:
          input = document.createElement("input");
          input.className = "input-table"
          input.setAttribute("type", "text");
          input.value = 1;
          cell.appendChild(input);
          break;
        case columnsTable.colUnitPrice:
          cell.innerHTML = product.price;
          break;
        case columnsTable.colIva:
          let cbIVA = document.createElement("input");
          cbIVA.setAttribute("type", "checkbox");
          cbIVA.setAttribute("disabled", "true")
          cbIVA.checked = product.iva;
          cell.appendChild(cbIVA);
          break;
        case columnsTable.colDesc:
          input = document.createElement("input");
          input.setAttribute("type", "text");
          input.className = "input-table"
          input.value = 0;
          cell.appendChild(input);
          break;
        case columnsTable.colDescPerc:
          input = document.createElement("input");
          input.setAttribute("type", "text");
          input.className = "input-table"
          input.value = 0;
          cell.appendChild(input);
          break;
        case columnsTable.colAdds:
          input = document.createElement("input");
          input.setAttribute("type", "text");
          input.className = "input-table"
          input.value = 0;
          cell.appendChild(input);
          break;
        case columnsTable.colActions:
          cell.innerHTML = `
        <div class="options">
          <a href="javascript:;" class="text-danger mx-1 px-2" onclick="deleteProduct(this)">
            <i class="fas fa-trash-alt"></i>
          </a>
        </div>`;
          // cell.innerHTML = 0;
          break;
      }
    }

    calculateTotals();
  }
}

function calculateTotals() {
  const tbody = document.getElementById("productsTable").getElementsByTagName("tbody")[0];
  const columnsTable = {
    colCode: 0,
    colProduct: 1,
    colStock: 2,
    colQty: 3,
    colUnitPrice: 4,
    colIva: 5,
    colDesc: 6,
    colDescPerc: 7,
    colAdds: 8,
    colActions: 9,
  };
  const subIvaTotal = document.getElementById("subIvaTotal");
  const subNoIvaTotal = document.getElementById("subNoIvaTotal");
  const chargesTotal = document.getElementById("charges");
  const discountTotal = document.getElementById("discountTotal");
  const ivaTotal = document.getElementById("ivaTotal");
  const total = document.getElementById("total");
  let subIvaTotalValue = 0,
    subNoIvaTotalValue = 0,
    discountIvaValue = 0,
    discountNoIvaValue = 0,
    chargesValue = 0;
  // if (tbody.rows[0].cells[0].colSpan < 1) {

  for (let i = 0; i < tbody.rows.length; i++) {
    const row = tbody.rows[i];
    const productHasIva = row.cells[columnsTable.colIva].getElementsByTagName("input")[0].checked;
    let qty = Number(row.cells[columnsTable.colQty].getElementsByTagName("input")[0].value);
    let price = Number(row.cells[columnsTable.colUnitPrice].innerText);
    let discount = Number(row.cells[columnsTable.colDesc].getElementsByTagName("input")[0].value);
    let charges = Number(row.cells[columnsTable.colAdds].getElementsByTagName("input")[0].value);
    chargesValue += Number(charges);
    // *Calcula el subtotal 12%
    if (productHasIva) {
      price /= (100 + IVA) / 100;
      subIvaTotalValue += qty * price;
      discountIvaValue += discount;
    }
    // *Calcula el subtotal 0%
    else {
      subNoIvaTotalValue += qty * price;
      discountNoIvaValue += discount;
    }
  }

  subIvaTotal.value = subIvaTotalValue.toFixed(5);
  subIvaTotal.className = "hover-focus";
  subNoIvaTotal.value = subNoIvaTotalValue.toFixed(5);
  subNoIvaTotal.className = "hover-focus";
  discountTotal.value = (Number(discountIvaValue) + Number(discountNoIvaValue)).toFixed(5);
  discountTotal.className = "hover-focus";
  ivaTotal.value = (((Number(subIvaTotalValue) - Number(discountIvaValue)) * IVA) / 100).toFixed(5);
  ivaTotal.className = "hover-focus";
  chargesTotal.value = Number(chargesValue).toFixed(5);
  chargesTotal.className = "hover-focus";
  total.value = (
    Number(subIvaTotal.value) +
    Number(subNoIvaTotal.value) +
    Number(ivaTotal.value) -
    Number(discountTotal.value) +
    Number(chargesTotal.value)
  ).toFixed(2);
  total.className = "hover-focus";
  // }
}
