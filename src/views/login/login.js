// window.jQuery = window.$ = require('jquery');

const {
  ipcRenderer
} = require('electron')

btnLogin = document.getElementById("btnLogin")

btnLogin.addEventListener("click", checkLogin);

function checkLogin(e) {
  e.preventDefault();
  // e.stopPropagation(); // Don't bubble/capture the event

  const userData = {
    username: document.querySelector('#user').value,
    password: document.querySelector('#pass').value
  }

  ipcRenderer.send('loginPassed', userData)
}