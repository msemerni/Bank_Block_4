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
// 4. Аналогично для активных. 

// Для получения актуальных курсов валют использовать API (https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5). 
// Промисы использовать для работы с API в целях отправки запросов на сервер.
// Создать отдельный git-репозиторий для этого проекта и дальше работать с этим проектом в этом репозитории.

class Client {
  static id = 1;
  static clientBase = [];

  constructor(fullName, isActive, registrationDate) {
    this.id = Client.id++;
    this.fullName = fullName;
    this.isActive = isActive;
    this.registrationDate = registrationDate;
    this.debitAccounts = [];
    this.creditAccounts = [];
    Client.clientBase.push(this);
  }

  addDebitAccount(debitBalance, expiredDate, currencyType) {
    if(debitBalance >= 0) {
      this.debitAccounts.push({
        isActive: true,
        debitBalance: debitBalance,
        expiredDate: expiredDate,
        currencyType: currencyType,
      })
    } else {
      throw new Error("Balance should be >= 0");
    }
  }

  addCreditAccount(creditLimit, expiredDate, currencyType) {
    if(creditLimit >= 0) {
      this.creditAccounts.push({
        isActive: true,
        creditBalance: creditLimit,
        creditLimit: creditLimit,
        expiredDate: expiredDate,
        currencyType: currencyType,
      })
    } else {
      throw new Error("Limit should be >= 0");
    }
  }
}

// let misha = new Client("Misha", true, new Date(2011, 0, 1));
// misha.addDebitAccount(1000, new Date(2022, 11, 31), "UAH");
// misha.addDebitAccount(200, new Date(2024, 7, 15), "EUR");
// misha.addCreditAccount(3500, new Date(2025, 8, 5), "UAH");
// misha.addCreditAccount(100, new Date(2022, 8, 5), "USD");

// let ira = new Client("Ira", false, new Date(2020, 7, 9));
// ira.addDebitAccount(500, new Date(2022, 5, 20), "USD");
// ira.addCreditAccount(200, new Date(2026, 4, 2), "EUR");

function getCurrencyRates() {
  let currencyRates = fetch("https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5")
    .then(response => response.json())
    .then(rates => {
      let exchangeRates = {};

      for(let i = 0; i < rates.length; i++) {
        exchangeRates[rates[i].ccy] = +rates[i].sale;
      }
      exchangeRates["UAH"] = 1;
      return exchangeRates;
    })
  return currencyRates;
}

function getBankUSDAmount() {
  getCurrencyRates()
    .then(currencyRates => {
      let sumUSD = 0;
      Client.clientBase.map(client => {
        if(client.creditAccounts.length > 0) {
          client.creditAccounts.map(creditAccounts => {
            sumUSD += ((creditAccounts.creditBalance * currencyRates[creditAccounts.currencyType]) / currencyRates["USD"]);
            if(isNaN(sumUSD)) {
              throw new Error (`No currency rate for ${creditAccounts.currencyType}`);
            }
          });
        }

        if(client.debitAccounts.length > 0) {
          client.debitAccounts.map(debitAccounts => {
            sumUSD += ((debitAccounts.debitBalance * currencyRates[debitAccounts.currencyType]) / currencyRates["USD"]);
            if(isNaN(sumUSD)) {
              throw new Error (`No currency rate for ${debitAccounts.currencyType}`);
            }
          });
        }
      });
      // console.log("Total USD in Bank: " + sumUSD);
      return sumUSD;
    })
}

getBankUSDAmount();
