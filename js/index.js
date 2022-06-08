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

function getCurrencyRates() {
  const currencyUsdRates = fetch("https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5")
    .then(response => response.json())
    .then(rates => {
      let exchangeRates = {};

      for (let i = 0; i < rates.length; i++) {
        exchangeRates[rates[i].ccy] = +rates[i].sale;
      }
      exchangeRates["UAH"] = 1;
      return exchangeRates;
    })
  return currencyUsdRates;
}

function getBankUsdAmount() {
  getCurrencyRates()
    .then(currencyRates => {
      let sumUSD = 0;
      Client.clientBase.map(client => {
        client.accounts.map(account => {
          sumUSD += account.balance * currencyRates[account.currencyType] / currencyRates["USD"]
        })
      });
      const rowone = document.getElementById('rowone');
      const sum = document.createElement("div");
      sum.innerHTML = `
      <span>Total money in bank (USD): ${sumUSD}</span>
      `;
      rowone.append(sum);
      return sumUSD;
    })
}

function getClientsDebt() {
  getCurrencyRates()
    .then(currencyRates => {
      let debtsSum = 0;
      Client.clientBase.map(client => {
        client.accounts.map(account => {
          if (account.accountType === "creditAccount") {
            debtsSum += (account.creditLimit - account.balance) * currencyRates[account.currencyType] / currencyRates["USD"];
          }
        });
      });
      const rowone = document.getElementById('rowone');
      const debt = document.createElement("div");
      debt.innerHTML = `
      <span>Total debt (USD): ${debtsSum}</span>
      `;
      rowone.append(debt);
      return debtsSum;
    })
}

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

      const rowone = document.getElementById('rowone');
      const clientsDebts = document.createElement("div");
      if (isActiveStatus) {
        clientsDebts.innerHTML = 
        `
        <span>Active ${allCreditors.CreditorsCount} client(s) debt (USD): ${allCreditors.TotalDebts}</span>
        `;
      }
      if (!isActiveStatus) {
        clientsDebts.innerHTML = 
        `
        <span>Not active ${allCreditors.CreditorsCount} client(s) debt (USD): ${allCreditors.TotalDebts}</span>
        `;
      }
      rowone.append(clientsDebts);
      return allCreditors;
    })
}

function showBankInfo() {
  const rowone = document.getElementById('rowone');
  rowone.innerHTML = ""
  getBankUsdAmount();
  getClientsDebt();
  getCreditors(true);
  getCreditors(false);
}

function renderAllClients() {
  const cardBox = document.getElementById("card");
  cardBox.innerHTML = "";

  Client.clientBase.map(client => {
    const clientCard = document.createElement("div");
    clientCard.classList = "usercard";
    clientCard.innerHTML = `
    <h4>${client.fullName}</h4>
    <span>Id: <b>${client.id}</b></span>
    <span>Active: <b>${client.isActive}</b></span>
    <span>Date: <b>${('0' + client.registrationDate.getDate()).slice(-2) + '-' + ('0' + (client.registrationDate.getMonth() + 1)).slice(-2) + '-' + client.registrationDate.getFullYear()}</b></span>
    `;
    cardBox.append(clientCard);

    const accountsBox = document.createElement("div");
    accountsBox.id = "accts";
    clientCard.append(accountsBox);

    client.accounts.map(data => {
      const accountElem = document.createElement("p");
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

function addNewClient() {
  const fullName = document.getElementById("name");
  const status = document.getElementById("status");
  const dateReg = document.getElementById("dateReg");

  let clientStatus = true;

  if (status.value === "notActive") {
    clientStatus = false;
  }

  if (fullName.value === "") {
    alert("Add name");
  }
  else if (dateReg.valueAsDate === null) {
    alert("Add registration date");
  } else {
    new Client(fullName.value, clientStatus, dateReg.valueAsDate);
    document.getElementById("clientBoxForm").reset();
    renderAllClients();
    renderOptionDeleteClientBox();
    showBankInfo();
  }
}

function addAccount() {
  const txtAddAccount = document.getElementById("txtAddAccount").value;
  const accountType = document.getElementById("accountType").value;
  const currencyType = document.getElementById("currencyType").value;
  const balance = document.getElementById("accountBalance").value;
  const creditLimit = document.getElementById("accountBalance").value;
  const accountStatusTxt = document.getElementById("accountStatus").value;
  let accountStatus;

  if (accountStatusTxt === "true") {
    accountStatus = true;
  } else {
    accountStatus = false;
  }

  const expiredDate = document.getElementById("dateExpired").value;
  const indexClient = Client.clientBase.findIndex((client) => client.fullName === txtAddAccount);
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
  const fullNameToDelete = document.getElementById("txtAutoComplete").value;
  const index = Client.clientBase.findIndex((client) => client.fullName === fullNameToDelete);
  if (index >= 0) {
    const confirmation = confirm("Are you sure?");
    if (confirmation) {
      Client.clientBase.splice(index, 1);
      renderAllClients();
      renderOptionDeleteClientBox();
      showBankInfo();
    }
  } else {
    alert(fullNameToDelete + " not found");
  }
  document.getElementById("deleteClientBoxForm").reset();
}

function renderAddClientBox() {
  const clientBoxForm = document.createElement("form");
  clientBoxForm.id = "clientBoxForm";
  const clientBox = document.createElement("fieldset");
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

  const btnAddClient = document.createElement("button");
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

function renderAddAccountBox() {
  const addAccountBoxForm = document.createElement("form");
  addAccountBoxForm.id = "addAccountBoxForm";
  addAccountBoxForm.innerHTML = "";
  const addAccountBox = document.createElement("fieldset");
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
  const btnAddAccount = document.createElement("button");
  btnAddAccount.classList = "btn";
  btnAddAccount.innerText = "Add account";
  addAccountBox.append(btnAddAccount);
  btnAddAccount.addEventListener("click", (event) => {
    event.preventDefault();
    addAccount();
  });
}

function renderDeleteClientBox() {
  const deleteClientBoxForm = document.createElement("form");
  deleteClientBoxForm.id = "deleteClientBoxForm";
  deleteClientBoxForm.innerHTML = "";
  const deleteClientBox = document.createElement("fieldset");
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
  const btnDeleteClient = document.createElement("button");
  btnDeleteClient.classList = "btn";
  btnDeleteClient.innerText = "Delete client";
  deleteClientBox.append(btnDeleteClient);
  btnDeleteClient.addEventListener("click", (event) => {
    event.preventDefault();
    deleteClient();
    renderOptionDeleteClientBox();
  });
}

function renderOptionDeleteClientBox() {
  const clientList = document.getElementById("clientList");
  clientList.innerHTML = "";
  Client.clientBase.map(client => {
    const optionClientList = document.createElement("option");
    optionClientList.value = client.fullName;
    clientList.append(optionClientList);
  })
}

showBankInfo();
renderAllClients();
renderAddClientBox();
renderAddAccountBox();
renderDeleteClientBox();
renderOptionDeleteClientBox();
