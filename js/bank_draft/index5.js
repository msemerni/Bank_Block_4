'use strict';

// https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5
// Клиенты банка, имеют такие характеристики - фио, активный или нет, дата регистрации в банке, счета. 
// Существует два типа счетов: дебетовый и кредитовый. 
// Дебитовый счет имеет текущий баланс либо он положителен либо нулевой. 
// Кредитовый счет имеет два баланса: личные средства, кредитные средства и кредитный лимит. 
// У каждого счета есть активность, дата активности когда заканчивается срок годности пластиковой карты. 
// У каждого счета есть тип валюты, UAH, RUB, USD, GBP, EUR и другие. 
// У пользователя может быть несколько счетов одновременно. 

// 1. Подсчитать общее количество денег внутри банка в долларовом эквиваленте учитывая кредитные лимиты и снятие средств. 
// 2. Посчитать сколько всего денег в долларовом эквиваленте все клиенты должны банку. 
// 3. Посчитать сколько неактивных клиентов должны погасить кредит банку и на какую общую сумму. 
// 3a. Аналогично для активных. 

// Для получения актуальных курсов валют использовать API (https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5). 
// Промисы использовать для работы с API в целях отправки запросов на сервер.
// Создать отдельный git-репозиторий для этого проекта и дальше работать с этим проектом в этом репозитории.

// Вывести задания из раздела “Объекты” в HTML на страницу браузера. 
// Создать формы добавления новых элементов, реализовать возможность удаления и изменения данных.


class Client {
  static id = 1;
  static clientBase = [];

  constructor(fullName, isActive, registrationDate) {
    this.id = Client.id++;
    this.fullName = fullName;
    this.isActive = isActive;
    this.registrationDate = registrationDate;
    this.accounts = [];
    Client.clientBase.push(this);
  }

  addDebitAccount(balance, expiredDate, currencyType, isActive) {
    if (balance < 0) {
      throw ("Balance should be more zero");
    }
    this.accounts.push({
      accountType: 'debitAccount',
      isActive: isActive,
      balance: balance,
      expiredDate: expiredDate,
      currencyType: currencyType,
    })
  }

  addCreditAccount(creditLimit, expiredDate, currencyType, isActive) {
    if (creditLimit < 0) {
      throw ("Limit should be more zero");
    }
    this.accounts.push({
      accountType: 'creditAccount',
      isActive: isActive,
      balance: creditLimit,
      creditLimit: creditLimit,
      expiredDate: expiredDate,
      currencyType: currencyType,
    })
  }
}


let misha = new Client("Semernin Misha", true, new Date(2011, 0, 15));
misha.addDebitAccount(1000, new Date(2022, 11, 31), "UAH", true);
misha.addDebitAccount(200, new Date(2024, 7, 15), "EUR", false);
misha.addCreditAccount(3500, new Date(2025, 8, 5), "UAH", true);
misha.addCreditAccount(100, new Date(2022, 8, 5), "USD", false);
misha.accounts[3].balance -= 50;
// misha.isActive = false;

let ira = new Client("Ivanova Ira", false, new Date(2020, 7, 9));
ira.addDebitAccount(500, new Date(2022, 5, 20), "USD", true);
ira.addCreditAccount(200, new Date(2026, 4, 2), "EUR", false);
ira.accounts[1].balance -= 100;

console.log(misha);
console.log(ira);
console.log(Client.clientBase);
console.log(misha.accounts[0].currencyType);
// ira.isActive = true;
// console.log(ira);

function getCurrencyRates() {
  let currencyUsdRates = fetch("https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5")
    .then(response => response.json())
    .then(rates => {
      let exchangeRates = {};
      console.log(rates);
      
      for (let i = 0; i < rates.length; i++) {
        exchangeRates[rates[i].ccy] = +rates[i].sale;
        console.log(exchangeRates);
      }
      exchangeRates["UAH"] = 1;

      return exchangeRates;
    })

  return currencyUsdRates;
}


// //// sixth variant
// 1. Подсчитать общее количество денег внутри банка в долларовом эквиваленте учитывая кредитные лимиты и снятие средств. 
function getBankUsdAmount() {
  getCurrencyRates()
    .then(currencyRates => {
      let sumUSD = 0;
      Client.clientBase.map(client => { client.accounts.map(account => {
        sumUSD += account.balance * currencyRates[account.currencyType] / currencyRates["USD"] }) 
      });
      console.log(sumUSD);

      ///*///
      let rowone = document.getElementById('rowone');
      let sum = document.createElement("div");
      sum.innerHTML = `
      <span>Total money in bank (USD): ${sumUSD}</span>
      `;
      rowone.append(sum);
      ///**///

      return sumUSD;
    })
}

//// sixth variant
// 2. Посчитать сколько всего денег в долларовом эквиваленте все клиенты должны банку. 
function getClientsDebt() {
  getCurrencyRates()
    .then(currencyRates => {
      let debtsSum = 0;
      Client.clientBase.map(client => {
        client.accounts.map(account => {
          if(account.accountType === "creditAccount") {
            debtsSum += (account.creditLimit - account.balance) * currencyRates[account.currencyType] / currencyRates["USD"];
          }
        });
      });

      console.log("Total debt (USD): " + debtsSum);

      ///*///
      let rowone = document.getElementById('rowone');
      let debt = document.createElement("div");
      debt.innerHTML = `
      <span>Total debt (USD): ${debtsSum}</span>
      `;
      rowone.append(debt);
      ///**///

      return debtsSum;
    })
}



// //// sixth variant
// // // 3. Посчитать сколько неактивных клиентов должны погасить кредит банку и на какую общую сумму. 
// // // 3a. Аналогично для активных. 

function getCreditors(isActiveStatus) {
  getCurrencyRates()
    .then(currencyRates => {
      let allCreditors = {
        CreditorsCount: 0,
        TotalDebts: 0,
      };

      Client.clientBase.map(client => {
        client.accounts.map(account => {
          if (account.accountType === "creditAccount" && account.balance < account.creditLimit && client.isActive === isActiveStatus) {
            allCreditors.TotalDebts += (account.creditLimit - account.balance) * currencyRates[account.currencyType] / currencyRates["USD"];
            allCreditors.CreditorsCount++;
          }
        });
      });

      console.log(allCreditors);

      ///*///
      let rowone = document.getElementById('rowone');
      let clientsDebts = document.createElement("div");
      if (isActiveStatus) {
        clientsDebts.innerHTML = `
        <span>Active ${allCreditors.CreditorsCount} client(s) debt (USD): ${allCreditors.TotalDebts}</span>
        `;
      } 
      if (!isActiveStatus) {
        clientsDebts.innerHTML = `
        <span>Not active ${allCreditors.CreditorsCount} client(s) debt (USD): ${allCreditors.TotalDebts}</span>
        `;
      }
      rowone.append(clientsDebts);
      ///**///

      return allCreditors;
    })
}

function showBankInfo() {
  let rowone = document.getElementById('rowone');
  rowone.innerHTML = ""
  getBankUsdAmount();
  getClientsDebt();
  getCreditors(true);
  getCreditors(false);
}

showBankInfo();
renderAllClients();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function renderAllClients() {
  let cardBox = document.getElementById("card");
  cardBox.innerHTML = "";

  Client.clientBase.map(client => {

    let clientCard = document.createElement("div");
    clientCard.classList = "usercard";
    clientCard.innerHTML = `
    <h4>${client.fullName}</h4>
    <span>Id: <b>${client.id}</b></span>
    <span>Active: <b>${client.isActive}</b></span>
    <span>Date: <b>${('0' + client.registrationDate.getDate()).slice(-2) + '-' + ('0' + (client.registrationDate.getMonth() + 1)).slice(-2) + '-' + client.registrationDate.getFullYear()}</b></span>
    
    `;
    cardBox.append(clientCard);

    let accountsBox = document.createElement("div");
    accountsBox.id = "accts";
    clientCard.append(accountsBox);
    ////
    client.accounts.map(data => {
      let accountElem = document.createElement("p");
      if (data.accountType === "debitAccount") {
        accountElem.innerHTML =
        `
        Debit account ${data.currencyType}: <b>${data.balance}</b> 
          `
      accountsBox.append(accountElem);
      }
      if (data.accountType === "creditAccount") {
        accountElem.innerHTML =
        `
        Credit account ${data.currencyType}: <b>${data.balance}</b> 
          `
      accountsBox.append(accountElem);
      }
      
    });

  })
}


///*///
function addNewClient() {
  // let misha = new Client("Semernin Misha", true, new Date(2011, 0, 1));
  let fullName = document.getElementById("name");
  let status = document.getElementById("status");
  let dateReg = document.getElementById("dateReg");

  let clientStatus = true;

  if (status.value === "notActive") {
    clientStatus = false;
  }

  if (fullName.value === "") {
    alert("Add name");
  } 
  else if (dateReg.valueAsDate === null){
    alert("Add registration date");
  } else {
    new Client(fullName.value, clientStatus, dateReg.valueAsDate);
    console.log(Client.clientBase);
    document.getElementById("clientBoxForm").reset();
    renderAllClients();
    renderOptionDeleteClientBox();
    showBankInfo();
  }
}

function addAccount() {
  let txtAddAccount = document.getElementById("txtAddAccount").value;
  let accountType = document.getElementById("accountType").value;
  let currencyType = document.getElementById("currencyType").value;
  let balance  = document.getElementById("accountBalance").value;
  let creditLimit  = document.getElementById("accountBalance").value;
  let accountStatusTxt  = document.getElementById("accountStatus").value;
  let accountStatus;
  if (accountStatusTxt === "true") {
    accountStatus = true;
  } else {
    accountStatus = false;
  }

  let expiredDate = document.getElementById("dateExpired").value;

  let indexClient = Client.clientBase.findIndex((client) => client.fullName === txtAddAccount);

  if (indexClient === -1) {
    alert("Add client first");
    return;
  }

  if (accountType === "Debit") {
    Client.clientBase[indexClient].addDebitAccount(balance, expiredDate, currencyType, accountStatus);
  } else {
    Client.clientBase[indexClient].addCreditAccount(creditLimit, expiredDate, currencyType, accountStatus);
  }

  renderAllClients();
  showBankInfo();
}

function deleteClient() {
  let fullNameToDelete = document.getElementById("txtAutoComplete").value;

  let index = Client.clientBase.findIndex((client) => client.fullName === fullNameToDelete);
  if (index >= 0) {
    let confirmation = confirm("Are you sure?");
    if (confirmation) {
      Client.clientBase.splice(index, 1);
      console.log(Client.clientBase);
      renderAllClients();
      renderOptionDeleteClientBox();
      showBankInfo();
      // alert(fullNameToDelete + " deleted");
    }
  } else {
    alert(fullNameToDelete + " not found");
  }
  document.getElementById("deleteClientBoxForm").reset();
}


function renderAddClientBox() {
  //// 1
  let clientBoxForm = document.createElement("form");
  clientBoxForm.id = "clientBoxForm";
  let clientBox = document.createElement("fieldset");
  clientBox.id = "clientBox";
  clientBox.innerHTML =
  `
  <legend><b>Add client</b></legend>
  <p>
    <label for="name">Full Name: </label><br>
    <input type="text" id="name" placeholder="Enter client\`s full name">
  </p>
  <p>
    <label for="status">Client status:</label><br>
    <select id="status" name="status">
      <option value="active">Active</option>
      <option value="notActive">Not active</option>
    </select>
  </p>
  <p>
    <label for="dateReg">Registration date: </label><br>
    <input type="date" id="dateReg">
  </p>
  `;

  let btnAddClient = document.createElement("button");
  btnAddClient.classList = "btn";
  btnAddClient.innerText = "Add client";
  clientBox.append(btnAddClient);
  document.getElementById("aside").append(clientBoxForm);
  document.getElementById("clientBoxForm").append(clientBox);

  btnAddClient.addEventListener("click", (event) => {
    event.preventDefault();
    addNewClient();
    renderOptionDeleteClientBox();
  });
}

renderAddClientBox();

//// 2
function renderAddAccountBox() {
  let addAccountBoxForm = document.createElement("form");
  addAccountBoxForm.id = "addAccountBoxForm";
  addAccountBoxForm.innerHTML = "";

  let addAccountBox = document.createElement("fieldset");
  addAccountBox.id = "addAccountBox";
  addAccountBox.innerHTML =
    `
		<legend><b>Add account</b></legend>
		<p>
      <label for="txtAddAccount">Full Name: </label><br>
		  <input type="text" id="txtAddAccount" list="clientList" placeholder="Enter client\`s full name"/>
		  <datalist id="clientList"></datalist>
		</p>
		<p>
      <label for="accountType">Account type:</label><br>
			<select name="accountType" id="accountType">
        <option value="Debit">Debit</option>
        <option value="Credit">Credit</option>
      </select>
		</p>
    <p>
      <label for="currencyType">Currency type:</label><br>
      <select name="currencyType" id="currencyType">
        <option value="UAH">UAH</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="BTC">BTC</option>
      </select>
    </p>
    <p>
      <label for="accountBalance">Account balance/Credit limit:</label><br>
      <input type="number" id="accountBalance" value = "0">
    </p>
    <p>
      <label for="accountStatus">Account status:</label><br>
      <select id="accountStatus" name="accountStatus">
        <option value="true">Active account</option>
        <option value="false">Not active account</option>
      </select>
    </p>
    <p>
      <label for="dateReg">Expired date: </label><br>
      <input type="date" id="dateExpired">
    </p>
  `;

  document.getElementById("aside").append(addAccountBoxForm);
  document.getElementById("addAccountBoxForm").append(addAccountBox);

  let btnAddAccount = document.createElement("button");
  btnAddAccount.classList = "btn";
  btnAddAccount.innerText = "Add account";
  addAccountBox.append(btnAddAccount);
  //
  btnAddAccount.addEventListener("click", (event) => {
    event.preventDefault();
    addAccount();
  });
}

renderAddAccountBox();

//// 3
function renderDeleteClientBox() {
  let deleteClientBoxForm = document.createElement("form");
  deleteClientBoxForm.id = "deleteClientBoxForm";
  deleteClientBoxForm.innerHTML = "";

  let deleteClientBox = document.createElement("fieldset");
  deleteClientBox.id = "deleteClientBox";
  deleteClientBox.innerHTML =
    `
  <legend><b>Delete client</b></legend>
  <p>
    <input type="text" id="txtAutoComplete" list="clientList" placeholder="Enter client\`s full name"/>
    <datalist id="clientList"></datalist>
  </p>
  `;

  document.getElementById("aside").append(deleteClientBoxForm);
  document.getElementById("deleteClientBoxForm").append(deleteClientBox);

  let btnDeleteClient = document.createElement("button");
  btnDeleteClient.classList = "btn";
  btnDeleteClient.innerText = "Delete client";
  deleteClientBox.append(btnDeleteClient);
  //
  btnDeleteClient.addEventListener("click", (event) => {
    event.preventDefault();
    deleteClient();
    renderOptionDeleteClientBox();
  });
}

renderDeleteClientBox();

function renderOptionDeleteClientBox() {
  let clientList = document.getElementById("clientList");
  clientList.innerHTML = "";
  Client.clientBase.map(client => {
    let optionClientList = document.createElement("option");
    optionClientList.value = client.fullName;
    clientList.append(optionClientList);
  })
}
///**///

renderOptionDeleteClientBox();
