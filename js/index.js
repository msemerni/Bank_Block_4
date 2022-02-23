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

function getBankUsdAmount() {
  getCurrencyRates()
    .then(currencyRates => {
      let sumUSD = 0;
      let totalBankMoney = [];
      Client.clientBase.map(client => {
        totalBankMoney.push(client.creditAccounts, client.debitAccounts);
      });
      let allBankMoney = [].concat(...totalBankMoney);

      for(let i = 0; i < allBankMoney.length; i++) {
        sumUSD += allBankMoney[i].creditBalance * currencyRates[allBankMoney[i].currencyType] / currencyRates["USD"] ||
          allBankMoney[i].debitBalance * currencyRates[allBankMoney[i].currencyType] / currencyRates["USD"];
      }
      return sumUSD;
    })
}

function getClientsDebt() {
  getCurrencyRates()
    .then(currencyRates => {
      let debtsSum = 0;
      let totalCreditAccounts = [];
      Client.clientBase.map(client => {
        totalCreditAccounts.push(client.creditAccounts);
      });
      let allCreditAccounts = [].concat(...totalCreditAccounts);

      for(let i = 0; i < allCreditAccounts.length; i++) {
        debtsSum += (allCreditAccounts[i].creditLimit - allCreditAccounts[i].creditBalance) * currencyRates[allCreditAccounts[i].currencyType] / currencyRates["USD"];
      }
      return debtsSum;
    })
}

function getCreditors(isActiveStatus) {
  getCurrencyRates()
    .then(currencyRates => {
      let clientsDebtsSum = 0;
      let totalCreditAccounts = [];
      let allCreditors = {};
      Client.clientBase.map(client => {
        if(client.isActive === isActiveStatus){
          totalCreditAccounts.push(client.creditAccounts);
        }
      });
      let allCreditAccounts = [].concat(...totalCreditAccounts);
       
      for(let i = 0; i < allCreditAccounts.length; i++) {
        clientsDebtsSum += (allCreditAccounts[i].creditLimit - allCreditAccounts[i].creditBalance) * currencyRates[allCreditAccounts[i].currencyType] / currencyRates["USD"];
      }
      allCreditors.CreditorsCount = totalCreditAccounts.length;
      allCreditors.TotalDebts = clientsDebtsSum;
      return allCreditors;
    })
}
