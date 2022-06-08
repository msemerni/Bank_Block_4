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

    ///*///
    this.clientCard = document.createElement("div");
    this.clientCard.classList = "usercard";
    this.clientCard.innerHTML = `
    <h4>${this.fullName}</h4>
    <span>Id: <b>${this.id}</b></span>
    <span>Active: <b>${this.isActive}</b></span>
    <span>Date: <b>${('0' + this.registrationDate.getDate()).slice(-2) + '-' + ('0' + (this.registrationDate.getMonth() + 1)).slice(-2) + '-' + this.registrationDate.getFullYear() }</b></span>
    `;
    document.getElementById("card").append(this.clientCard);

    this.accountsBox = document.createElement("div");
    this.accountsBox.id = "accts";
    this.clientCard.append(this.accountsBox);

    ///**///
  }

  addDebitAccount(balance, expiredDate, currencyType) {
    if (balance < 0) {
      throw ("Balance should be more zero");
    }
    this.accounts.push({
      accountType: 'debitAccount',
      isActive: true,
      balance: balance,
      expiredDate: expiredDate,
      currencyType: currencyType,
    })
    ///*///
     this.accounts.map(data => {
      this.accountElem = document.createElement("p");
      this.accountElem.innerHTML = 
      `
      Debit account ${data.currencyType}: <b>${data.balance}</b> 
      `
     });
    this.accountsBox.append(this.accountElem);
    ///**///
  }

  addCreditAccount(creditLimit, expiredDate, currencyType) {
    if (creditLimit < 0) {
      throw ("Limit should be more zero");
    }
    this.accounts.push({
      accountType: 'creditAccount',
      isActive: true,
      balance: creditLimit,
      creditLimit: creditLimit,
      expiredDate: expiredDate,
      currencyType: currencyType,
    })
    ///*///
    this.accounts.map(data => {
      this.accountElem = document.createElement("p");
      this.accountElem.innerHTML =
      `
      Credit account ${data.currencyType}: <b>${data.balance}</b>
      `
    });
    this.accountsBox.append(this.accountElem);
    ///**///
  }
}



let misha = new Client("Semernin Misha", true, new Date(2011, 0, 15));
misha.addDebitAccount(1000, new Date(2022, 11, 31), "UAH");
misha.addDebitAccount(200, new Date(2024, 7, 15), "EUR");
misha.addCreditAccount(3500, new Date(2025, 8, 5), "UAH");
misha.addCreditAccount(100, new Date(2022, 8, 5), "USD");
misha.accounts[3].balance -= 50;
// misha.isActive = false;

let ira = new Client("Ivanova Ira", false, new Date(2020, 7, 9));
ira.addDebitAccount(500, new Date(2022, 5, 20), "USD");
ira.addCreditAccount(200, new Date(2026, 4, 2), "EUR");
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

function showBankInfo () {
  getBankUsdAmount();
  getClientsDebt();
  getCreditors(true);
  getCreditors(false);
}

showBankInfo();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

  if (dateReg.valueAsDate === null) {
    alert("Add registration date");
  }else {
  
  new Client(fullName.value, clientStatus, dateReg.valueAsDate);
  console.log(Client.clientBase);
  document.getElementById("clientBoxForm").reset();
  }
  // fullName.value = "";
  // status.value = "";
  // dateReg.value = "";

  // alert("New client added");
}

function deleteClient() {
  let fullNameToDelete = document.getElementById("nameToDelete").value;

  let index = Client.clientBase.findIndex((client) => client.fullName === fullNameToDelete);

  if (index >= 0) {
    Client.clientBase.splice(index, 1);
    alert(fullNameToDelete + " deleted");
  } else {
  alert(fullNameToDelete + " not found");
  }


  // let rr = document.getElementById("card").removeChild(this.clientCard);
  // let rr = document.getElementById("card");
  // let cardToDelete = document.querySelectorAll(".usercard");
  // console.log(cardToDelete);
  // console.log(rr);


  console.log(Client.clientBase);
}

//// 1
let clientBoxForm = document.createElement("form");
clientBoxForm.id = "clientBoxForm";
let clientBox = document.createElement("fieldset");
clientBox.id = "clientBox";
clientBox.innerHTML = 
`
<legend>Add new client</legend>
<p>
  <label for="name">Full Name: </label><br>
  <input type="text" id="name">
</p>
<p>
  <label for="status">Client status:</label><br>
  <select id="status" name="status">
    <option value="active">Active</option>
    <option value="notActive">Not Active</option>
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
});

//// 2
let deleteClientBoxForm = document.createElement("form");
deleteClientBoxForm.id = "deleteClientBoxForm";
let deleteClientBox = document.createElement("fieldset");
deleteClientBox.id = "deleteClientBox";
deleteClientBox.innerHTML = 
`
<legend>Delete client</legend>
<p>
  <label for="name">Full Name: </label><br>
  <input type="text" id="nameToDelete">
</p>
`;

let btnDeleteClient = document.createElement("button");
btnDeleteClient.classList = "btn";
btnDeleteClient.innerText = "Delete client";
deleteClientBox.append(btnDeleteClient);


document.getElementById("aside").append(deleteClientBoxForm);
document.getElementById("deleteClientBoxForm").append(deleteClientBox);

btnDeleteClient.addEventListener("click", (event) => {
  event.preventDefault();
  deleteClient();
});

///**///

