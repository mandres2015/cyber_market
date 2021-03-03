const path = require("path");

const { app, BrowserWindow, ipcMain } = require("electron");

require("electron-reload")(__dirname, {
  electron: path.join(__dirname, "node_modules", ".bin", "electron"),
});
const { credentials } = require("./src/database");
const { Client, Pool } = require("pg");

const pool = new Pool(credentials);

const { exception } = require("console");
const { isArray, param } = require("jquery");
const { isObject } = require("util");

var win;

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.maximize();

  // and load the index.html of the app.
  // var url = path.join('src', 'views', 'login', 'login.html');
  // var url = path.join('src', 'views', 'menu', 'menu.html');
  var url = path.join("src", "views", "sale", "sale.html");
  // ipcMain.once('allBrands', getBrands())
  // ipcMain.once('allCategories', getCategories())
  win.loadFile(url);
}

ipcMain.on("getMeasures", async (event) => {
  const measures = await query("SELECT * FROM measure");
  console.log(measures.rows);
  event.reply("allMeasures", measures.rows);
});

ipcMain.on("getBrands", async (event) => {
  const brands = await query("SELECT * FROM brand");
  console.log(brands.rows);
  event.reply("allBrands", brands.rows);
});

ipcMain.on("getCategories", async (event) => {
  const categories = await query("SELECT * FROM category");
  console.log(categories.rows);
  event.reply("allCategories", categories.rows);
});

async function query(q, p) {
  const client = new Client(credentials);
  await client.connect();
  let res;
  try {
    await client.query("BEGIN");
    try {
      res = await client.query(q, p);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  } finally {
    client.end();
  }
  return res;
}

app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

/**
 * ESCUCHAR EVENTOS
 */
// LOGIN
ipcMain.on("loginPassed", (e, userData) => {
  const client = new Client(credentials);
  client.connect();
  const query = `SELECT EXISTS (
    SELECT * FROM user_system WHERE user_name = $1 AND password = $2
  )`;
  const values = [userData.username, userData.password];
  client.query(query, values, (err, res) => {
    if (err) {
      document.getElementById("userHelp").innerText = "hola";
    } else {
      console.log(res.rows[0]);
      if (res.rows[0].exists) {
        var url = path.join("src", "views", "menu", "menu.html");
        win.loadFile(url);
      } else {
        console.log("NO EXISTE");
      }
    }
    client.end();
  });
});

// COMPRAS
ipcMain.on("getProviders", (e, params) => {
  let response = {
    status: "",
    data: "",
  };
  const client = new Client(credentials);
  const query = `SELECT p.tradename, pe.dni 
    FROM provider p 
    LEFT JOIN person pe ON pe.id = p.id
    WHERE pe.dni LIKE $1
    OR UPPER(tradename) LIKE UPPER($1)`;
  client.connect();
  client.query(query, params, (err, res) => {
    if (err) {
      response.status = -1;
      win.webContents.send("sendProviders", response);
    } else {
      console.log(res.rows);
      if (res.rows) {
        response.status = 1;
        response.data = res.rows;
        console.log("POR ENVIAR");
        win.webContents.send("sendProviders", response);
        console.log("ENVIADO");
      } else {
        console.log("NO HAY NADA WEY");
      }
    }
    client.end();
  });
});

ipcMain.on("saveProvider", (e, params) => {
  let response = {
    status: "",
    data: "",
  };

  params.date = new Date();

  queryCheck = `SELECT EXISTS(
        SELECT pro.id FROM person p LEFT JOIN provider pro ON p.id = pro.id WHERE dni = $1
    )`;

  // const queryText = 'INSERT INTO users(name) VALUES($1) RETURNING id'

  const client = new Client(credentials);
  client.connect();

  // INSERTA EN LA TABLA PERSONA
  client.query(queryCheck, [params.dni], (err, resCheck) => {
    // INGRESA SI HAY UN ERROR AL INSERTAR
    if (err) {
      console.log("Ha ocurrido un error al verificar el proveedor", err);
      client.end();
    }
    console.log(resCheck);
    if (resCheck.rows[0].exists == false) {
      // COMIENZO DE LA TRANSACCION
      client.query("BEGIN", (err) => {
        // INGRESA SI FALLA EN BEGIN
        if (err) {
          console.log("Ocurrio un problema al empezar la transaccion de insertar proveedor", err);
          // return done(true); //pass non-falsy value to done to kill client & remove from pool
          client.end();
        }
        const queryPerson = `INSERT INTO person(dni, first_name, last_name, address, phone, email, created_at)
                                    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
        const paramsPerson = [params.dni, params.name, params.lName, params.address, params.phone, params.email, params.date];
        client.query(queryPerson, paramsPerson, (err, resPerson) => {
          // INGRESA SI HAY UN ERROR AL INSERTAR
          if (err) {
            console.log("No se pudo insertar el proveedor", err);
            return client.query("ROLLBACK", function (err) {
              if (err) {
                consoles.log("No se ha pudo hacer el ROLLBACK de esta transaccion", err);
              }
              response.status = -1;
              response.data = err;
              win.webContents.send("savedProvider", response);
              // done(err);
            });
          }
          // INGRESA SI NO HAY ERROR AL INSERTAR
          else {
            console.log("INSERTADA LA PERSONA");
            // console.log(resPerson);
            // INSERTA EN LA TABLA PROVEEDOR
            const queryProvider = `INSERT INTO provider(id, tradename, added_at) 
                                                VALUES($1, $2, $3)`;
            const paramsProvider = [resPerson.rows[0].id, params.tradename, params.date];
            client.query(queryProvider, paramsProvider, (err, resProvider) => {
              // INGRESA SI HAY UN ERROR AL INSERTAR
              if (err) {
                console.log("No se pudo insertar el proveedor", err);
                return client.query("ROLLBACK", function (err) {
                  if (err) {
                    console.log("No se ha pudo hacer el ROLLBACK de esta transaccion", err);
                  }
                  response.status = -1;
                  response.data = err;
                  win.webContents.send("savedProvider", response);
                  // done(err);
                });
              }
              // SI NO HAY ERROR EJECUTA LO SIGUIENTE
              console.log("INSERTADO EL PROVEEDOR");
              if (resProvider.rowCount > 0) {
                response.status = 1;
                response.data = 1;
                console.log("POR ENVIAR");
              } else {
                console.log("NO HAY NADA WEY");
              }
              // REALIZA UN COMMIT PARA GUARDAR LOS CAMBIOS
              client.query("COMMIT", function (err) {
                if (err) {
                  console.log("No se ha pudo hacer el COMMIT de esta transaccion", err);
                  response.status = -1;
                  response.data = err;
                }
                console.log("ENVIADO");
                win.webContents.send("savedProvider", response);
                // done(err);
                client.end();
              });
            });
          }
        });
      });
    } else {
      response.status = -1;
      response.data = err;
      console.log("El proveedor ya existe");
      win.webContents.send("savedProvider", response);
    }
  });
});

ipcMain.on("getProducts", (e, params) => {
  let response = {
    status: "",
    data: "",
  };
  const query = `SELECT p.id, p.code, p.name, p.price, p.stock, 
                  p.charge, p.commission,
                  p.has_iva as iva, p.has_ice as ice, p.has_irbp as irbp, 
                  b.name as brand, m.name as measure, is_product
                  FROM product p 
                  LEFT JOIN brand b ON b.id = p.brand_id 
                  LEFT JOIN measure m ON m.id = p.measure_id
                  WHERE CAST(p.id AS TEXT) LIKE UPPER($1)
                  OR UPPER(p.code) LIKE UPPER($1)
                  OR UPPER(p.name) LIKE UPPER($1)`;
  params[0] = "%" + cleanParams(params) + "%";

  pool
    .query(query, params)
    .then((res) => {
      response.status = 1;
      response.data = res.rows;
      console.log("POR ENVIAR");
      e.reply("sendProducts", response);
    })
    .catch((err) => {
      console.log(err.stack);
    });
});

ipcMain.on("saveProduct", (e, params) => {
  let response = {
    status: "",
    data: "",
  };
  const query = `INSERT INTO public.product(code, name, has_iva, has_ice, has_irbp, measure_id, brand_id, category_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`;

  params = cleanParams(params);
  const client = new Client(credentials);
  client.connect();
  client.query(
    query,
    [params.code, params.name, params.hasIVA, params.hasICE, params.hasIRBP, params.measure, params.brand, params.category],
    (err, res) => {
      if (err) {
        response.status = -1;
        response.data = err;
        console.log("Ocurrio un error: " + err);
        win.webContents.send("savedProduct", response);
      } else {
        console.log(res);
        if (res.rowCount > 0) {
          response.status = 1;
          response.data = 1;
          console.log("POR ENVIAR");
          win.webContents.send("savedProduct", response);
          console.log("ENVIADO");
        } else {
          console.log("NO HAY NADA WEY");
        }
      }
      client.end();
    }
  );
});

ipcMain.on("saveMeasure", (e, params) => {
  let response = {
    status: "",
    data: "",
  };

  if (validateParams(params)) {
    params = cleanParams(params);
    const query = `INSERT INTO measure(name)
                    VALUES ($1);`;
    const client = new Client(credentials);
    client.connect();
    client.query(query, params, (err, res) => {
      if (err) {
        response.status = -1;
        response.data = err;
        win.webContents.send("savedMeasure", response);
      } else {
        console.log(res);
        if (res.rowCount > 0) {
          response.status = 1;
          response.data = 1;
          console.log("POR ENVIAR");
          win.webContents.send("savedMeasure", response);
          console.log("ENVIADO");
        } else {
          console.log("NO HAY NADA WEY");
        }
      }
      client.end();
    });
  }
});

ipcMain.on("saveBrand", (e, params) => {
  let response = {
    status: "",
    data: "",
  };

  if (validateParams(params)) {
    params = cleanParams(params);
    const query = `INSERT INTO brand(name)
                    VALUES ($1);`;
    const client = new Client(credentials);
    client.connect();
    client.query(query, params, (err, res) => {
      if (err) {
        response.status = -1;
        response.data = err;
        win.webContents.send("savedBrand", response);
      } else {
        console.log(res);
        if (res.rowCount > 0) {
          response.status = 1;
          response.data = 1;
          console.log("POR ENVIAR");
          win.webContents.send("savedBrand", response);
          console.log("ENVIADO");
        } else {
          console.log("NO HAY NADA WEY");
        }
      }
      client.end();
    });
  }
});

ipcMain.on("saveCategory", (e, params) => {
  let response = {
    status: "",
    data: "",
  };

  if (validateParams(params)) {
    params = cleanParams(params);
    const query = `INSERT INTO category(name)
                    VALUES ($1);`;
    const client = new Client(credentials);
    client.connect();
    client.query(query, params, (err, res) => {
      if (err) {
        response.status = -1;
        response.data = err;
        win.webContents.send("savedCategory", response);
      } else {
        console.log(res);
        if (res.rowCount > 0) {
          response.status = 1;
          response.data = 1;
          console.log("POR ENVIAR");
          win.webContents.send("savedCategory", response);
          console.log("ENVIADO");
        } else {
          console.log("NO HAY NADA WEY");
        }
      }
      client.end();
    });
  }
});

function validateParams(params) {
  isValid = false;
  if (is_Object(params)) {
    for (const object in params) {
      if (params[object].length <= 0) {
        return false;
      } else {
        isValid = true;
      }
    }
  } else {
    params.forEach((param) => {
      if (param.length <= 0) {
        return false;
      } else {
        isValid = true;
      }
    });
  }
  return isValid;
}

is_Array = function (a) {
  return !!a && a.constructor === Array;
};

is_Object = function (a) {
  return !!a && a.constructor === Object;
};

function cleanParams(params) {
  if (is_Object(params)) {
    for (const object in params) {
      if (typeof params[object] === "string" || params[object] instanceof String) {
        params[object] = params[object].toUpperCase();
        console.log(object);
      }
    }
  } else {
    params.forEach((param, i) => {
      if (typeof param === "string" || param instanceof String) {
        params[i] = param.toUpperCase();
        console.log(param);
      }
    });
  }

  return params;
}

ipcMain.on("getClients", (e, params) => {
  let response = {
    status: "",
    data: "",
  };

  const query = `SELECT c.id, p.first_name, p.last_name 
  FROM client c LEFT JOIN person p ON p.id = c.id
  WHERE CAST(p.dni AS TEXT) LIKE UPPER($1)
  OR UPPER(CONCAT(p.first_name, p.last_name)) LIKE UPPER($1)
  OR UPPER(CONCAT(p.last_name, p.first_name)) LIKE UPPER($1)`;
  params[0] = "%" + cleanParams(params) + "%";

  // promise - checkout a client
  pool
    .query(query, params)
    .then((res) => {
      response.status = 1;
      response.data = res.rows;
      console.log("ENVIADO");
      e.reply("sendClients", response);
      console.log(res.rows[0]);
    })
    .catch((err) => {
      console.log(err.stack);
    });
});

ipcMain.on("saveSale", (e, params) => {
  let response = {
    status: "",
    data: "",
  };

  const querySale = `INSERT INTO sale(
      client_id, user_id, sale_date, iva, discount, subtotal, charge, total, pay_method_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`;

  params = cleanParams(params);

  const client = new Client(credentials);
  client.connect();
  client
    .query(querySale, [params.clientId, 1, new Date(), params.iva, params.discount, params.subtotal, params.charges, params.total, 1])
    .then((res) => {
      response.status = 1;
      response.data = res.rows;
      // client.end()
      console.log("Response\n");
      console.log(res);
      e.reply("saleSaved", response);
    })
    .catch((e) => console.error(e.stack))
    .finally(() => client.end());
});
