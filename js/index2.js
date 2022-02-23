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
    if (debitBalance >= 0) {
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
    if (creditLimit >= 0) {
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

let misha = new Client("Misha", true, new Date(2011, 0, 1));
misha.addDebitAccount(1000, new Date(2022, 11, 31), "UAH");
misha.addDebitAccount(200, new Date(2024, 7, 15), "EUR");
misha.addCreditAccount(3500, new Date(2025, 8, 5), "UAH");
misha.addCreditAccount(100, new Date(2022, 8, 5), "USD");
misha.creditAccounts[1].creditBalance -= 50;
misha.isActive = false;

let ira = new Client("Ira", false, new Date(2020, 7, 9));
ira.addDebitAccount(500, new Date(2022, 5, 20), "USD");
ira.addCreditAccount(200, new Date(2026, 4, 2), "EUR");
ira.creditAccounts[0].creditBalance -= 100;

console.log(misha);
console.log(ira);
console.log(Client.clientBase);
console.log(misha.debitAccounts[0].currencyType);

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

// function getCurrencyRates() {
//   let currencyUsdRates = fetch("https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5")
//     .then(response => response.json())
//     .then(rates => {
//       let exchangeRates = {};
//       let usdSale;
//       console.log(rates);
//       for (let i = 0; i < rates.length; i++) {
//         if (rates[i].ccy === "USD") {
//           usdSale = rates[i].sale;
//           console.log(usdSale);
//         }
//         exchangeRates[rates[i].ccy] = rates[i].sale;
//         console.log(exchangeRates);
//       }
//       for (let i = 0; i < rates.length; i++) {
//         exchangeRates[rates[i].ccy] = usdSale / rates[i].sale;
//         console.log(exchangeRates);
//       }
//       exchangeRates["UAH"] = +usdSale;

//       return exchangeRates;
//     })
//   return currencyUsdRates;
// }

// function getCurrencyRates() {
//   let usdRate = fetch("https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5")
//     .then(response => response.json())
//     .then(rates => {
//       let exchangeRates;
//       console.log(rates);
//       for (let i = 0; i < rates.length; i++) {
//         if (rates[i].ccy === "USD") {
//           exchangeRates = rates[i].sale;
//           console.log(exchangeRates + " USD SALE");
//         }

//       }
//       return exchangeRates;
//     })
//   return usdRate;
// }

// ////// first variant
// function getBankUSDAmount() {
//   let sumUSD = 0;

//   getCurrencyRates()
//     .then(rates => {
//       console.log(rates);
//       Client.clientBase.map(client => {
//         // console.log(client);

//         client.creditAccounts.map(creditAccounts => {
//           // console.log(creditBal.currencyType);
//           let usdRate;

//           for (let i = 0; i < rates.length; i++) {
//             if (rates[i].ccy === "USD") {
//               usdRate = rates[i].sale;
//               console.log(usdRate + " USD SALE");
//             }

//             if (creditAccounts.currencyType === "UAH") {
//               sumUSD += (creditAccounts.creditBalance / usdRate);
//               console.log(sumUSD + " UAH to USD");
//               return;
//             }

//             if (creditAccounts.currencyType === rates[i].ccy) {
//               // console.log(rates[i].ccy + "rate" + rates[i].sale);
//               console.log(creditAccounts);
//               sumUSD += (creditAccounts.creditBalance * (rates[i].sale / usdRate));
//               console.log(rates[i].ccy + " TO usd: " + rates[i].sale / usdRate);
//             }
//           }
//         });

//         client.debitAccounts.map(debitAccounts => {
//           // console.log(creditBal.currencyType);
//           let usdRate;

//           for (let i = 0; i < rates.length; i++) {
//             if (rates[i].ccy === "USD") {
//               usdRate = rates[i].sale;
//               console.log(usdRate + " USD SALE");
//             }

//             if (debitAccounts.currencyType === "UAH") {
//               sumUSD += (debitAccounts.debitBalance / usdRate);
//               console.log(sumUSD + " UAH to USD");
//               return;
//             }

//             if (debitAccounts.currencyType === rates[i].ccy) {
//               // console.log(rates[i].ccy + "rate" + rates[i].sale);
//               console.log(debitAccounts);
//               sumUSD += (debitAccounts.debitBalance * (rates[i].sale / usdRate));
//               console.log(rates[i].ccy + " TO usd: " + rates[i].sale / usdRate);
//             }
//           }
//         });
//       })

//       console.log("Total USD in Bank: " + sumUSD);
//       return sumUSD;
//     }
//     )
// }

/////////////////////////////

////// second variant
// function getBankUSDAmount() {


//   getCurrencyRates()
//     .then(currencyUsdRates => {
//       let sumUSD = 0;
//       console.log(currencyUsdRates);
//       Client.clientBase.map(client => {

//         if (client.creditAccounts.length > 0) {
//           client.creditAccounts.map(creditAccounts => {
//             sumUSD += ((creditAccounts.creditBalance * currencyUsdRates[creditAccounts.currencyType]) / currencyUsdRates["USD"]);
//             if(isNaN(sumUSD)) {
//               throw new Error (`No currency rate for ${creditAccounts.currencyType}`);
//             }
//             console.log(sumUSD + " to USD");
//           });
//         }

//         if (client.debitAccounts.length > 0) {

//           client.debitAccounts.map(debitAccounts => {
//             sumUSD += ((debitAccounts.debitBalance * currencyUsdRates[debitAccounts.currencyType]) / currencyUsdRates["USD"]);
//             if(isNaN(sumUSD)) {
//               throw new Error (`No currency rate for ${debitAccounts.currencyType}`);
//             }
//             console.log(sumUSD + " to USD");
//           });
//         }


//       })

//       console.log("Total USD in Bank: " + sumUSD);
//       return sumUSD;
//     }
//     )
// }
////// third variant
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
      console.log(allBankMoney);
      console.log("Total USD in Bank: " + sumUSD);
      return sumUSD;
    })
}

getBankUsdAmount();



// 50S 100E

function getClientsDebt () {
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

      console.log("Total Debts: " + debtsSum);
      return debtsSum;

    })

}

getClientsDebt();

// 3. Посчитать сколько неактивных клиентов должны погасить кредит банку и на какую общую сумму. 
// 3a. Аналогично для активных. 

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

      console.log(allCreditors);
      return allCreditors;
    })
}

getCreditors(false);