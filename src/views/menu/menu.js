// COMPRAS
const { ipcRenderer } = require("electron");
const { data } = require("jquery");
let $ = require("jquery");
require("popper.js");
require("bootstrap");
require("bootstrap-select");

let providers;
const IVA = 12,
  ICE = 10,
  IRBP = 0.02;

function init() {
  $("select").selectpicker({
    noneSelectedText: "Seleccionar",
  });
}

// To style all selects
$(function () {
  init();
  refreshMeasures();
  refreshBrands();
  refreshCategories();
});

function refreshMeasures() {
  ipcRenderer.on("allMeasures", (e, response) => {
    console.log("Medidas");
    console.log(response);
    fillSelect("newMeasureProd", response);
  });
  ipcRenderer.send("getMeasures", "");
}

function refreshBrands() {
  ipcRenderer.on("allBrands", (e, response) => {
    console.log("Marcas");
    console.log(response);
    fillSelect("newBrandProd", response);
  });
  ipcRenderer.send("getBrands", "");
}

function refreshCategories() {
  ipcRenderer.on("allCategories", (e, response) => {
    console.log("Categorias");
    console.log(response);
    fillSelect("newCatProd", response);
  });
  ipcRenderer.send("getCategories", "");
}

// * Rellena el select con las opciones de response
// ! response debe tener parametros id y name
function fillSelect(idselect, response) {
  var select = document.getElementById(idselect);
  select.options.length = 0;
  for (i = 0; i < response.length; i++) {
    select.options[select.options.length] = new Option(
      response[i].name,
      response[i].id
    );
  }
  $("#" + idselect).selectpicker("refresh");
  $("#" + idselect).selectpicker("val", "");
}

// ADD EVENT TO TYPE A CHARACTER FOR CSS
document.querySelectorAll("input[type=text]").forEach((item) => {
  if (!item.className.includes("input-table")) {
    item.addEventListener("input", (event) => {
      if (item.value == null || item.value == "") {
        item.className = "";
      } else {
        if (item.value.length > 0) {
          item.className = "hover-focus";
        }
      }
    });
  }
});

const searchProv = document.querySelector("#searchProv");
const btnSearchProv = document.querySelector("#btnSearchProv");
searchProv.addEventListener("keyup", getProviders);
btnSearchProv.addEventListener("click", getProviders);

function getProviders() {
  const searchProvVal = searchProv.value;
  console.log(searchProvVal);

  if (searchProvVal.length >= 3) {
    console.log("Esperando 1");

    const params = ["%" + searchProvVal.toUpperCase() + "%"];

    ipcRenderer.send("getProviders", params);
  } else {
    providers = "";
    showProviders();
  }
}

ipcRenderer.on("sendProviders", (e, response) => {
  console.log("entre");
  providers = response.data;
  showProviders();
});

function showProviders() {
  let providersList = document.querySelector("#providersList");
  providersList.innerHTML = "";
  for (let i = 0; i < providers.length; i++) {
    const provs = providers[i];
    console.log(provs);
    var li = document.createElement("li");
    li.appendChild(document.createTextNode(provs.tradename));
    li.setAttribute("id", "prov" + i); // added line
    li.setAttribute("class", "prov"); // added line
    li.addEventListener("click", fillProvider);
    providersList.appendChild(li);
  }
}

function fillProvider(e) {
  console.log(e);
  const nodes = Array.from(e.target.closest("ul").children);
  const i = nodes.indexOf(e.target);
  document.querySelector("#idProv").value = providers[i].dni;
  document.querySelector("#idProv").className = "hover-focus";
  document.querySelector("#nameProv").value = providers[i].tradename;
  document.querySelector("#nameProv").className = "hover-focus";
  let providersList = document.querySelector("#providersList");
  providersList.innerHTML = "";
  searchProv.value = "";
}

// MODAL NEW PROVIDER
const CloseNewProv = document.querySelector("#CloseNewProv");
const SaveNewProv = document.querySelector("#SaveNewProv");

SaveNewProv.addEventListener("click", saveNewProvider);
CloseNewProv.addEventListener("click", cleanFieldProvider);

function saveNewProvider(e) {
  e.preventDefault();

  const dni = document.querySelector("#newDniProv").value;
  const tradename = document.querySelector("#newTradeProv").value;
  const name = document.querySelector("#newNameProv").value;
  const lName = document.querySelector("#newLNameProv").value;
  const address = document.querySelector("#newAddressProv").value;
  const phone = document.querySelector("#newPhoneProv").value;
  const email = document.querySelector("#newEmailProv").value;

  const params = {
    dni: dni,
    tradename: tradename,
    name: name,
    lName: lName,
    address: address,
    phone: phone,
    email: email,
  };

  ipcRenderer.send("saveProvider", params);
}

ipcRenderer.on("savedProvider", (e, response) => {
  if (response.status == -1) {
    console.log("Ha ocurrido un error: " + response.data);
  } else {
    cleanFieldProvider();
    console.log("GUARDADO");
  }
});

function cleanFieldProvider() {
  const id = document.querySelector("#newDniProv");
  const name = document.querySelector("#newNameProv");
  const lName = document.querySelector("#newLNameProv");
  const tradename = document.querySelector("#newTradeProv");
  const phone = document.querySelector("#newPhoneProv");
  const email = document.querySelector("#newEmailProv");

  id.value = "";
  id.className = "";
  name.value = "";
  name.className = "";
  lName.value = "";
  lName.className = "";
  tradename.value = "";
  tradename.className = "";
  phone.value = "";
  phone.className = "";
  email.value = "";
  email.className = "";
}

/**
 * ? JS DE PRODUCTOS
 */
const searchProd = document.querySelector("#searchProd");
const btnSaveNewProd = document.querySelector("#SaveNewProd");
const btnCloseNewProd = document.querySelector("#CloseNewProd");
searchProd.addEventListener("keyup", getProducts);
btnSaveNewProd.addEventListener("click", saveNewProduct);
btnCloseNewProd.addEventListener("click", cleanFieldNewProduct);

let products;

function saveNewProduct(e) {
  e.preventDefault();

  const code = document.querySelector("#newCodeProd").value;
  const name = document.querySelector("#newNameProd").value;
  const measure = document.querySelector("#newMeasureProd").selectedOptions[0]
    .value;
  const brand = document.querySelector("#newBrandProd").selectedOptions[0]
    .value;
  const category = document.querySelector("#newCatProd").selectedOptions[0]
    .value;
  const hasIVA = document.querySelector("#newIVAProd").checked;
  const hasICE = document.querySelector("#newICEProd").checked;
  const hasIRBP = document.querySelector("#newIRBPProd").checked;
  // const hasICE = document.querySelector('#newICEProd').checked
  const params = {
    code: code,
    name: name,
    measure: measure,
    brand: brand,
    category: category,
    hasIVA: hasIVA,
    hasICE: hasICE,
    hasIRBP: hasIRBP,
  };

  if (name.length > 0) {
    ipcRenderer.send("saveProduct", params);
  }
}

function getProducts() {
  const searchProdVal = searchProd.value;
  console.log(searchProdVal);

  if (searchProdVal.length >= 1) {
    console.log("Esperando 1");

    const params = [searchProdVal];

    ipcRenderer.send("getProducts", params);
  } else {
    products = "";
    showProducts();
  }
}

ipcRenderer.on("sendProducts", (e, response) => {
  console.log("entre");
  console.log(response);
  products = response.data;
  showProducts();
});

function showProducts() {
  let productsList = document.querySelector("#productsList");
  productsList.innerHTML = "";
  for (let i = 0; i < products.length; i++) {
    const prods = products[i];
    console.log(prods);
    var li = document.createElement("li");
    li.appendChild(document.createTextNode(prods.name));
    li.setAttribute("id", "prod" + prods.id); // added line
    li.setAttribute("class", "prod"); // added line
    li.addEventListener("click", fillProduct);
    productsList.appendChild(li);
  }
}

function fillProduct(e) {
  console.log(e);
  console.log(products);
  const nodes = Array.from(e.target.closest("ul").children);
  const i = nodes.indexOf(e.target);
  clearProductFields();
  const id = document.querySelector("#idProd");
  const code = document.querySelector("#codeProd");
  const name = document.querySelector("#nameProd");
  const measure = document.querySelector("#measureProd");
  const brand = document.querySelector("#brandProd");
  const iva = document.querySelector("#IVA");
  const ice = document.querySelector("#ICE");
  const irbp = document.querySelector("#IRBP");
  id.value = products[i].id;
  id.className = "hover-focus";
  code.value = products[i].code;
  code.className = "hover-focus";
  name.value = products[i].name;
  name.className = "hover-focus";
  measure.value = products[i].measure;
  measure.className = "hover-focus";
  brand.value = products[i].brand;
  brand.className = "hover-focus";
  iva.checked = products[i].iva;
  ice.checked = products[i].ice;
  irbp.checked = products[i].irbp;
  let productsList = document.querySelector("#productsList");
  productsList.innerHTML = "";
  searchProd.value = "";
}

function clearProductFields() {
  const inputs = document
    .getElementById("productsForm")
    .getElementsByTagName("input");
  for (let input of inputs) {
    if (input.type !== "button") {
      if (input.type !== "checkbox") {
        input.value = "";
        input.className = "";
      } else {
        input.checked = false;
      }
    }
  }
}

ipcRenderer.on("savedProduct", (e, response) => {
  if (response.status == -1) {
    console.log("Ha ocurrido un error: " + response.data);
  } else {
    cleanFieldNewProduct();
    console.log("GUARDADO");
  }
});

function cleanFieldNewProduct() {
  const inputs = document
    .getElementById("divModalNewProduct")
    .getElementsByClassName("modal-body")[0]
    .getElementsByTagName("input");
  for (const input of inputs) {
    if (input.type !== "button") {
      if (input.type !== "checkbox") {
        input.value = "";
        input.className = "";
      } else {
        input.checked = false;
      }
    }
  }
  $("#divModalNewProduct .modal-body select").selectpicker("val", "");
}

// * Agrega listeners al modal nueva medida
btnSaveMeasure = document.getElementById("SaveNewMeasure");
btnSaveBrand = document.getElementById("SaveNewBrand");
btnSaveCategory = document.getElementById("SaveNewCategory");
btnSaveMeasure.addEventListener("click", saveMeasure);
btnSaveBrand.addEventListener("click", saveBrand);
btnSaveCategory.addEventListener("click", saveCategory);

// ? NUEVA MEDIDA
function saveMeasure(e) {
  e.preventDefault();
  const name = document.getElementById("newNameMeasureProd").value;
  const params = [name];

  ipcRenderer.send("saveMeasure", params);
}

ipcRenderer.on("savedMeasure", (e, response) => {
  if (response.status == -1) {
    console.log("Ha ocurrido un error: " + response.data);
  } else {
    document.getElementById("newNameMeasureProd").value = "";
    console.log("GUARDADO");
    refreshMeasures();
    $("#modalNewMeasureProd").modal("hide");
  }
});

// ? NUEVA MARCA
function saveBrand(e) {
  e.preventDefault();
  const name = document.getElementById("newNameBrandProd").value;
  const params = [name];

  ipcRenderer.send("saveBrand", params);
}

ipcRenderer.on("savedBrand", (e, response) => {
  if (response.status == -1) {
    console.log("Ha ocurrido un error: " + response.data);
  } else {
    document.getElementById("newNameBrandProd").value = "";
    console.log("GUARDADO");
    refreshBrands();
    $("#modalNewBrandProd").modal("hide");
  }
});

// ? NUEVA CATEGORIA
function saveCategory(e) {
  e.preventDefault();
  const name = document.getElementById("newNameCategoryProd").value;
  const params = [name];

  ipcRenderer.send("saveCategory", params);
}

ipcRenderer.on("savedCategory", (e, response) => {
  if (response.status == -1) {
    console.log("Ha ocurrido un error: " + response.data);
  } else {
    document.getElementById("newNameCategoryProd").value = "";
    console.log("GUARDADO");
    refreshCategories();
    $("#modalNewCategoryProd").modal("hide");
  }
});

const percentage = document.getElementById("percProd");
const discount = document.getElementById("descProd");
const price = document.getElementById("priceProd");
const qty = document.getElementById("qtyProd");
percentage.addEventListener("change", calculateDiscounts);
discount.addEventListener("change", calculateDiscounts);
price.addEventListener("keyup", calculateDiscounts);
qty.addEventListener("keyup", calculateDiscounts);

function calculateDiscounts(e) {
  const percentage = document.getElementById("percProd");
  const discount = document.getElementById("descProd");
  const qty = document.getElementById("qtyProd");
  const priceInput = document.getElementById("priceProd");
  const subtotal = document.getElementById("subProd");
  const iva = document.getElementById("IVA");

  const price =
    parseFloat(document.getElementById("priceProd").value) * qty.value;

  // if () {

  // }

  if (
    e.target.value.length === 0 ||
    priceInput.value === 0 ||
    qty.value.length === 0
  ) {
    console.log("jeje");
    percentage.value =
      percentage.value.length != 0
        ? parseFloat(percentage.value).toFixed(4)
        : (0).toFixed(4);
    discount.value = (0).toFixed(4);
    subtotal.value = (0).toFixed(4);
    // priceInput.value = ''
  } else {
    if (priceInput.value.length != 0 && qty.value.length != 0) {
      if (e.target == priceInput) {
      } else if (e.target == percentage) {
        discount.value = ((price * percentage.value) / 100).toFixed(4);
      } else if (e.target == discount) {
        percentage.value = ((discount.value * 100) / price).toFixed(4);
      }
      discount.value = ((price * percentage.value) / 100).toFixed(4);
      percentage.value = ((discount.value * 100) / price).toFixed(4);
      subtotal.value = (price - discount.value).toFixed(4);
    }
  }

  addClassInputProduct();
}

function addClassInputProduct(e) {
  const inputs = document
    .getElementById("productsForm")
    .getElementsByTagName("input");
  for (let input of inputs) {
    if (input.type !== "button") {
      if (input.type !== "checkbox") {
        if (input.value !== "") {
          input.className = "hover-focus";
        } else {
          input.className = "";
        }
      }
    }
  }
}

btnAddProd = document.getElementById("addProd");
btnCancelProd = document.getElementById("cancelProd");
btnAddProd.addEventListener("click", addProdToTable);
btnCancelProd.addEventListener("click", clearProductFields);

function addProdToTable(e) {
  if (validateProductFields()) {
    const id = document.getElementById("idProd").value;
    const name = document.getElementById("nameProd").value;
    const price = document.getElementById("priceProd").value;
    const qty = document.getElementById("qtyProd").value;
    const desc = document.getElementById("descProd").value;
    const iva = document.getElementById("IVA").checked;
    const ice = document.getElementById("ICE").checked;
    const irbp = document.getElementById("IRBP").checked;
    const subtotal = document.getElementById("subProd").value;
    const table = document.getElementById("tableProducts");
    let finalPrice = parseFloat(subtotal).toFixed(4);

    const subTable = (parseFloat(price) * qty).toFixed(4);
    const rowCount = table.getElementsByTagName("tbody")[0].childElementCount;

    if (ice) {
      finalPrice = Number((finalPrice * (ICE / 100 + 1)).toFixed(4));
    }
    if (iva) {
      finalPrice = Number((finalPrice * (IVA / 100 + 1)).toFixed(4));
    }
    if (irbp) {
      finalPrice = Number((finalPrice + IRBP * qty).toFixed(4));
    }

    const unitPrice = (finalPrice / qty).toFixed(2);

    const data = [
      id,
      name,
      qty,
      subTable,
      desc,
      iva,
      ice,
      irbp,
      finalPrice,
      unitPrice,
    ];

    let row = table.getElementsByTagName("tbody")[0].insertRow(rowCount);

    for (let i = 0; i < data.length + 2; i++) {
      const element = data[i];
      let cell = row.insertCell(i);
      cell.className = "column-product";
      if (i == data.length) {
        cell.innerHTML = `<input class="input-group pvp" type="text" name="pvp-${rowCount}" id="pvp-${rowCount}">`;
      } else if (i == data.length + 1) {
        cell.innerHTML = `
        <div class="options">
          <a href="javascript:;" class="text-dark mx-1 px-2" onclick="editProduct(this)">
            <i class="fas fa-edit"></i>
          </a>
          <a href="javascript:;" class="text-danger mx-1 px-2" onclick="deleteProduct(this)">
            <i class="fas fa-trash-alt"></i>
          </a>
        </div>`;
      } else if (i == 6) {
        if (iva) {
          cell.innerHTML = `<input class="input-group" type="checkbox" checked disabled>`;
        } else {
          cell.innerHTML = `<input class="input-group" type="checkbox" disabled>`;
        }
      } else if (i == 5) {
        if (ice) {
          cell.innerHTML = `<input class="input-group" type="checkbox" checked disabled>`;
        } else {
          cell.innerHTML = `<input class="input-group" type="checkbox" disabled>`;
        }
      } else if (i == 7) {
        if (irbp) {
          cell.innerHTML = `<input class="input-group" type="checkbox" checked disabled>`;
        } else {
          cell.innerHTML = `<input class="input-group" type="checkbox" disabled>`;
        }
      } else {
        cell.innerHTML = `<span class="data-column">${element}</span>`;
      }
    }

    clearProductFields();
    calculateTotals();
  }
}

function validateProductFields() {
  const id = document.getElementById("idProd");
  const code = document.getElementById("codeProd");
  const name = document.getElementById("nameProd");
  const price = document.getElementById("priceProd");
  const qty = document.getElementById("qtyProd");
  const measure = document.getElementById("measureProd");
  const brand = document.getElementById("brandProd");
  const percentage = document.getElementById("percProd");
  const desc = document.getElementById("descProd");
  const iva = document.getElementById("IVA");
  const subtotal = document.getElementById("subProd");

  if (
    id.value.length !== 0 &&
    name.value.length !== 0 &&
    price.value.length !== 0 &&
    qty.value.length !== 0 &&
    subtotal.value.length !== 0
  ) {
    console.log("validado");
    return true;
  }
  console.log("no validado");
  return false;
}

function calculateTotals() {
  const table = document.getElementById("tableProducts"),
    n = table.rows.length,
    subCol = 3,
    desCol = 4,
    ivaCol = 5;
  let subTotal = 0,
    subIva = 0,
    descIva = 0,
    descNoIva = 0,
    desTotal = 0,
    ivaTotal = 0,
    iceTotal = 0,
    irbpTotal = 0,
    total = 0;

  for (let row = 1; row < n; ++row) {
    if (table.rows[row].cells.length > ivaCol) {
      const desc = Number(
        parseFloat(table.rows[row].cells[desCol].innerText).toFixed(2)
      );
      desTotal += desc;
      console.log(desTotal);
      console.log(ivaTotal);
      const sub = Number(
        parseFloat(table.rows[row].cells[subCol].innerText).toFixed(2)
      );
      if (table.rows[row].cells[ivaCol].children[0].checked) {
        subIva += sub;
        descIva += desc;
        console.log(subIva);
      } else {
        subTotal += sub;
        descNoIva += desc;
        console.log(subTotal);
      }
    }
  }

  iceTotal = Number(parseFloat((subIva - descIva) * (IVA / 100)).toFixed(2));
  ivaTotal = Number(parseFloat((subIva - descIva) * (IVA / 100)).toFixed(2));
  irbpTotal = Number(parseFloat((subIva - descIva) * (IVA / 100)).toFixed(2));

  total += parseFloat(subTotal - descNoIva + (subIva - descIva) + ivaTotal);

  document.getElementById("subTotal").value = subTotal.toFixed(2);
  document.getElementById("subIva").value = subIva.toFixed(2);
  document.getElementById("DescTotal").value = desTotal.toFixed(2);
  document.getElementById("IvaTotal").value = ivaTotal.toFixed(2);
  document.getElementById("Total").value = total.toFixed(2);

  const inputs = document
    .getElementById("totalValues")
    .getElementsByTagName("input");
  for (let input of inputs) {
    if (input.type !== "button") {
      if (input.type !== "checkbox") {
        if (input.value !== "") {
          input.className = "hover-focus";
        } else {
          input.className = "";
        }
      }
    }
  }
}

// * DELETE PRODUCTS OF TABLE
function deleteProduct(e) {
  let row = e.parentElement.parentElement.parentElement;
  document.getElementById("tableProducts").deleteRow(row.rowIndex);
  calculateTotals();
}

function editProduct() {}

const btnSave = document.getElementById("btnSavePurchase");
btnSave.addEventListener("click", savePurchase);

function savePurchase() {
  let serieFac = document.getElementById("serieFac");
  let numFac = document.getElementById("numFac");
  let dateBuy = document.getElementById("dateBuy");
  let idProv = document.getElementById("idProv");
  let table = document.getElementById("tableProducts");
  let subTotal = document.getElementById("subTotal");
  let descTotal = document.getElementById("DescTotal");
  let ivaTotal = document.getElementById("IvaTotal");
  let total = document.getElementById("Total");

  let data = {
    serieFac: serieFac,
    numFac: numFac,
    dateBuy: dateBuy,
    idProv: idProv,
    subtotal: subTotal,
    descTotal: descTotal,
    ivaTotal: ivaTotal,
    total: total,
  };

  let rows = table.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
  let products = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const values = row.getElementsByClassName("data-column");

    console.log(values);

    const id = values[0].innerHTML;
    const qty = values[2].innerHTML;
    const subtotal = values[3].innerHTML;
    const discount = values[4].innerHTML;
    const iva = values[0].innerHTML;
    const pvp = ow.getElementsByClassName("pvp")[0].value;

    const dataP = {
      id: id,
      price: subtotal,
      qty: qty,
      desc: discount,
      iva: iva,
      pvp: pvp,
    };

    products.push(dataP);
  }

  console.log(products);
}
