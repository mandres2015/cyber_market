// COMPRAS
const { ipcRenderer } = require("electron");
const { data, each } = require("jquery");
let $ = require("jquery");
require("popper.js");
require("bootstrap");
require("bootstrap-select");

const IVA = 12;
const columnsTable = {
  colCode: 0,
  colProduct: 1,
  colBrand: 2,
  colStock: 3,
  colQty: 4,
  colUnitPrice: 5,
  colIva: 6,
  colDesc: 7,
  colDescPerc: 8,
  colAdds: 9,
  colTotal: 10,
  colActions: 11,
};
let g;

function tableEmpty() {
  const table = document.getElementById("productsTable");
  let tbody = table.getElementsByTagName("tbody")[0];

  if (tbody.rows.length === 0) {
    let columns = table.rows[0].cells.length;
    let row = tbody.insertRow();
    let cell = row.insertCell(0);
    cell.innerHTML = "No hay productos agregados";
    cell.colSpan = columns;
  }

  document.getElementById("subIvaTotal").value = 0;
  document.getElementById("subIvaTotal").className = "hover-focus";
  document.getElementById("subNoIvaTotal").value = 0;
  document.getElementById("subNoIvaTotal").className = "hover-focus";
  document.getElementById("discountTotal").value = 0;
  document.getElementById("discountTotal").className = "hover-focus";
  document.getElementById("ivaTotal").value = 0;
  document.getElementById("ivaTotal").className = "hover-focus";
  document.getElementById("charges").value = 0;
  document.getElementById("charges").className = "hover-focus";
  document.getElementById("total").value = 0;
  document.getElementById("total").className = "hover-focus";
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
document.getElementById("client").focus();

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
    if (tbody.rows[0].cells[0].colSpan > 1) {
      cleanTable();
    }
    let row = tbody.insertRow();
    let input;
    for (const col in columnsTable) {
      let cell = row.insertCell(columnsTable[col]);
      cell.classList.add("cell-table");
      switch (columnsTable[col]) {
        case columnsTable.colCode:
          cell.innerHTML = product.id;
          break;
        case columnsTable.colProduct:
          cell.innerHTML = product.name;
          break;
        case columnsTable.colBrand:
          if (product.is_product) {
            cell.innerHTML = product.brand;
          } else {
            cell.innerHTML = product.entity;
          }
          break;
        case columnsTable.colStock:
          cell.innerHTML = product.stock;
          break;
        case columnsTable.colQty:
          cell.classList.add("p-0");
          input = document.createElement("input");
          input.className = "input-table";
          input.setAttribute("type", "text");
          input.value = 1;
          input.addEventListener(
            "focusout",
            (element) => {
              calculateDiscount(element);
            },
            false
          );
          cell.appendChild(input);
          break;
        case columnsTable.colUnitPrice:
          cell.classList.add("p-0");
          input = document.createElement("input");
          input.setAttribute("type", "text");
          input.className = "input-table";
          if (product.iva) {
            input.value = (product.price / ((IVA + 100) / 100)).toFixed(5);
          } else {
            input.value = product.price;
          }
          if (product.is_product) {
            input.setAttribute("disabled", true);
          }
          cell.appendChild(input);
          break;
        case columnsTable.colIva:
          let cbIVA = document.createElement("input");
          cbIVA.setAttribute("type", "checkbox");
          cbIVA.setAttribute("disabled", "true");
          cbIVA.checked = product.iva;
          cell.appendChild(cbIVA);
          break;
        case columnsTable.colDesc:
          cell.classList.add("p-0");
          input = document.createElement("input");
          input.setAttribute("type", "text");
          input.className = "input-table";
          input.addEventListener(
            "focusout",
            (element) => {
              calculatePercentageDiscount(element);
            },
            false
          );
          input.value = 0;
          cell.appendChild(input);
          break;
        case columnsTable.colDescPerc:
          cell.classList.add("p-0");
          input = document.createElement("input");
          input.setAttribute("type", "text");
          input.className = "input-table";
          input.addEventListener(
            "focusout",
            (element) => {
              calculateDiscount(element);
            },
            false
          );
          input.value = 0;
          cell.appendChild(input);
          break;
        case columnsTable.colAdds:
          cell.classList.add("p-0");
          input = document.createElement("input");
          input.setAttribute("type", "text");
          input.className = "input-table";
          input.value = Number(product.charge) + Number(product.commission);
          input.addEventListener(
            "focusout",
            (element) => {
              calculateDiscount(element);
            },
            false
          );
          cell.appendChild(input);
          break;
        case columnsTable.colTotal:
          cell.innerHTML = 0;
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
      if (input != null) {
        input.addEventListener("focusout", calculateTotals);
      }
    }
    calculateTotalProduct(row.rowIndex);
    calculateTotals();
  }
}

function calculateTotalProduct(row) {
  const actualRow = document.getElementById("productsTable").getElementsByTagName("tbody")[0].rows[row - 1];
  if (actualRow.cells[columnsTable.colIva].getElementsByTagName("input")[0].checked) {
    actualRow.cells[columnsTable.colTotal].innerHTML = (
      Number(actualRow.cells[columnsTable.colUnitPrice].getElementsByTagName("input")[0].value) *
        ((IVA + 100) / 100) *
        Number(actualRow.cells[columnsTable.colQty].getElementsByTagName("input")[0].value) -
      Number(actualRow.cells[columnsTable.colDesc].getElementsByTagName("input")[0].value) +
      Number(actualRow.cells[columnsTable.colAdds].getElementsByTagName("input")[0].value)
    ).toFixed(2);
  } else {
    actualRow.cells[columnsTable.colTotal].innerHTML = (
      Number(actualRow.cells[columnsTable.colUnitPrice].getElementsByTagName("input")[0].value) *
        Number(actualRow.cells[columnsTable.colQty].getElementsByTagName("input")[0].value) -
      Number(actualRow.cells[columnsTable.colDesc].getElementsByTagName("input")[0].value) +
      Number(actualRow.cells[columnsTable.colAdds].getElementsByTagName("input")[0].value)
    ).toFixed(2);
  }
}

function calculateDiscount(element) {
  console.log(element);
  const row = element.target.parentElement.parentElement.rowIndex;
  const actualRow = document.getElementById("productsTable").getElementsByTagName("tbody")[0].rows[row - 1];
  let desc = 0;
  desc =
    (Number(actualRow.cells[columnsTable.colUnitPrice].getElementsByTagName("input")[0].value) *
      Number(actualRow.cells[columnsTable.colQty].getElementsByTagName("input")[0].value) *
      Number(actualRow.cells[columnsTable.colDescPerc].getElementsByTagName("input")[0].value)) /
    100;
  actualRow.cells[columnsTable.colDesc].getElementsByTagName("input")[0].value = desc.toFixed(5);
  actualRow.cells[columnsTable.colTotal].innerHTML = (
    Number(actualRow.cells[columnsTable.colUnitPrice].getElementsByTagName("input")[0].value) *
      Number(actualRow.cells[columnsTable.colQty].getElementsByTagName("input")[0].value) -
    desc +
    Number(actualRow.cells[columnsTable.colAdds].getElementsByTagName("input")[0].value)
  ).toFixed(2);
}

function calculatePercentageDiscount(element) {
  const row = element.target.parentElement.parentElement.rowIndex;
  const actualRow = document.getElementById("productsTable").getElementsByTagName("tbody")[0].rows[row - 1];
  let desc = 0;
  desc =
    (Number(actualRow.cells[columnsTable.colDesc].getElementsByTagName("input")[0].value) /
      (Number(actualRow.cells[columnsTable.colUnitPrice].getElementsByTagName("input")[0].value) *
        Number(actualRow.cells[columnsTable.colQty].getElementsByTagName("input")[0].value))) *
    100;
  actualRow.cells[columnsTable.colDescPerc].getElementsByTagName("input")[0].value = desc.toFixed(5);
  actualRow.cells[columnsTable.colTotal].innerHTML = (
    Number(actualRow.cells[columnsTable.colUnitPrice].getElementsByTagName("input")[0].value) *
      Number(actualRow.cells[columnsTable.colQty].getElementsByTagName("input")[0].value) -
    Number(actualRow.cells[columnsTable.colDesc].getElementsByTagName("input")[0].value) +
    Number(actualRow.cells[columnsTable.colAdds].getElementsByTagName("input")[0].value)
  ).toFixed(2);
}

function calculateTotals() {
  const tbody = document.getElementById("productsTable").getElementsByTagName("tbody")[0];

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
  for (let i = 0; i < tbody.rows.length; i++) {
    const row = tbody.rows[i];
    const productHasIva = row.cells[columnsTable.colIva].getElementsByTagName("input")[0].checked;
    let qty = Number(row.cells[columnsTable.colQty].getElementsByTagName("input")[0].value);
    let price = Number(row.cells[columnsTable.colUnitPrice].getElementsByTagName("input")[0].value);
    let discount = Number(row.cells[columnsTable.colDesc].getElementsByTagName("input")[0].value);
    let charges = Number(row.cells[columnsTable.colAdds].getElementsByTagName("input")[0].value);
    chargesValue += Number(charges);
    // *Calcula el subtotal 12%
    if (productHasIva) {
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
  ivaTotal.value = Math.abs(((Number(subIvaTotalValue) - Number(discountIvaValue)) * IVA) / 100).toFixed(5);
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
}

function deleteProduct(element) {
  const row = element.parentElement.parentElement.parentElement.rowIndex;
  const tbody = document.getElementById("productsTable").getElementsByTagName("tbody")[0];
  tbody.deleteRow(row - 1);
  if (tbody.rows.length < 1) {
    tableEmpty();
  } else {
    calculateTotals();
  }
}

function openModalPayment() {
  console.log("XD");
  const tbody = document.getElementById("productsTable").getElementsByTagName("tbody")[0];
  const total = document.getElementById("total").value;
  if (tbody.rows[0].cells[0].colSpan <= 1 && Number(total) >= 0) {
    $("#modalPaymentMethod").modal("show");
    document.getElementById("divPayMethod").hidden = false;
    document.getElementById("divAmountTurned").hidden = true;
    document.getElementById("footerModalPayment").hidden = true;
  }
}

function cashOptions(e) {
  const total = document.getElementById("total").value;
  if (e.id == "btnCash") {
    document.getElementById("divPayMethod").hidden = true;
    document.getElementById("divAmountTurned").hidden = false;
    document.getElementById("footerModalPayment").hidden = false;
    document.getElementById("turned").value = total;
    document.getElementById("totalSale").value = total;
    document.getElementById("amount").focus();
  }
}

document.getElementById("amount").addEventListener("keyup", calculateTurned);

function calculateTurned() {
  const amount = document.getElementById("amount").value;
  const total = document.getElementById("total").value;
  const turned = document.getElementById("turned");

  turned.value = (amount - total).toFixed(2);
}

// !GUARDAR VENTA
function saveSale(e) {
  const client = document.getElementById("idClient");
  const subIvaTotal = document.getElementById("subIvaTotal");
  const subNoIvaTotal = document.getElementById("subNoIvaTotal");
  const discountTotal = document.getElementById("discountTotal");
  const ivaTotal = document.getElementById("ivaTotal");
  const charges = document.getElementById("charges");
  const total = document.getElementById("total");

  const tbody = document.getElementById("productsTable").getElementsByTagName("tbody")[0];

  let products = [];

  for (const product of tbody.rows) {
    prod = {};
    prod.id = product.cells[columnsTable.colCode].innerText;
    prod.qty = product.cells[columnsTable.colQty].getElementsByTagName("input")[0].value;
    prod.price = product.cells[columnsTable.colUnitPrice].getElementsByTagName("input")[0].value;
    prod.discuont = product.cells[columnsTable.colDesc].getElementsByTagName("input")[0].value;
    prod.charges = product.cells[columnsTable.colAdds].getElementsByTagName("input")[0].value;
    products.push(prod);
  }

  const subtotal = (Number(subIvaTotal.value) + Number(subNoIvaTotal.value)).toFixed(5);

  // FALTA LA FECHA, EL ID DEL USUARIO Y EL METODO DE PAGO
  const params = {
    clientId: client.value,
    subtotal: subtotal,
    discount: discountTotal.value,
    iva: ivaTotal.value,
    charges: charges.value,
    total: total.value,
    products: products,
  };

  ipcRenderer.send("saveSale", params);
}

ipcRenderer.on("saleSaved", (e, response) => {
  console.log(e);
  console.log(response);
  alert("GUARDADO");
});

// YA ESTA CASI TODO HECHO, SOLO FALTA GUARDAR LA TRANSACCION Y AGREGAR CLIENTE Y PRODUCTO O SERVICIO y VALIDACIONES
