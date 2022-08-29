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
  }
}

let misha = new Client("Misha", true, new Date(2011, 0, 1));
misha.addDebitAccount(1000, new Date(2022, 11, 31), "UAH");
misha.addDebitAccount(200, new Date(2024, 7, 15), "EUR");
misha.addCreditAccount(3500, new Date(2025, 8, 5), "UAH");
misha.addCreditAccount(100, new Date(2022, 8, 5), "USD");
misha.accounts[3].balance -= 50;
misha.isActive = false;

let ira = new Client("Ira", false, new Date(2020, 7, 9));
ira.addDebitAccount(500, new Date(2022, 5, 20), "USD");
ira.addCreditAccount(200, new Date(2026, 4, 2), "EUR");
ira.accounts[1].balance -= 100;

console.log(misha);
console.log(ira);
console.log(Client.clientBase);
console.log(misha.accounts[0].currencyType);
ira.isActive = true;
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
function getBankUsdAmount() {
  getCurrencyRates()
    .then(currencyRates => {
      let sumUSD = 0;
      Client.clientBase.map(client => { client.accounts.map(account => {
        sumUSD += account.balance * currencyRates[account.currencyType] / currencyRates["USD"] }) 
      });
      console.log(sumUSD);
      return sumUSD;
    })
}

getBankUsdAmount();


//// sixth variant
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

      console.log("Total Debts: " + debtsSum);
      return debtsSum;
    })
}

getClientsDebt();

// // // 3. Посчитать сколько неактивных клиентов должны погасить кредит банку и на какую общую сумму. 
// // // 3a. Аналогично для активных. 

// //// sixth variant
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
      return allCreditors;
    })
}

getCreditors(true);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

