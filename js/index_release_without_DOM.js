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
    if(balance < 0) {
      throw ("Balance should be more zero");
    }
    this.accounts.push({
      accountType: 'debitAccount',
      isActive: true,
      balance: balance,
      expiredDate: expiredDate,
      currencyType: currencyType,
    });
  }

  addCreditAccount(creditLimit, expiredDate, currencyType) {
    if(creditLimit < 0) {
      throw ("Limit should be more zero");
    }
    this.accounts.push({
      accountType: 'creditAccount',
      isActive: true,
      balance: creditLimit,
      creditLimit: creditLimit,
      expiredDate: expiredDate,
      currencyType: currencyType,
    });
  }
}

function getCurrencyRates() {
  let currencyUsdRates = fetch("https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5")
    .then(response => response.json())
    .then(rates => {
      let exchangeRates = {};

      for(let i = 0; i < rates.length; i++) {
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
          sumUSD += account.balance * currencyRates[account.currencyType] / currencyRates["USD"];
        });
      });
      return sumUSD;
    })
}

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
          if(account.accountType === "creditAccount" && account.balance < account.creditLimit && client.isActive === isActiveStatus) {
            allCreditors.TotalDebts += (account.creditLimit - account.balance) * currencyRates[account.currencyType] / currencyRates["USD"];
            allCreditors.CreditorsCount++;
          }
        });
      });
      return allCreditors;
    })
}
