'use strict';

// https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5
// Клиенты банка, имеют такие характеристики - фио, активный или нет, дата регистрации в банке, счета. 
// Существует два типа счетов: дебетовый и кредитовый. 
// Дебитовый счет имеет текущий баланс либо он положителен либо нулевой. 
// Кредитовый счет имеет два баланса: личные средства, кредитные средства и кредитный лимит. 
// У каждого счета есть активность, дата активности когда заканчивается срок годности пластиковой карты. 
// У каждого счета есть тип валюты, UAH, RUB, USD, GBP, EUR и другие. 
// У пользователя может быть несколько счетов одновременно. 

// Подсчитать общее количество денег внутри банка в долларовом эквиваленте учитывая кредитные лимиты и снятие средств. 
// Посчитать сколько всего денег в долларовом эквиваленте все клиенты должны банку. 
// Посчитать сколько неактивных клиентов должны погасить кредит банку и на какую общую сумму. 
// Аналогично для активных. 
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
    Client.clientBase.push(this);
  }

  addDebitAccount(balance, expiredDate, currencyType) {
    this.debitAccount = {
      isActive: true,
      balance: balance,
      expiredDate: expiredDate,
      currencyType: currencyType
    }
  }

  addCreditAccount(ownBalance, creditBalance, creditLimit, expiredDate, currencyType) {
    this.creditAccount = {
      isActive: true,
      ownBalance: ownBalance,
      creditBalance: creditBalance,
      creditLimit: creditLimit,
      expiredDate: expiredDate,
      currencyType: currencyType
    }
  }
}

let misha = new Client("Misha", true, new Date(2011, 0, 1));
misha.addDebitAccount(1000, new Date(2022, 11, 31), "UAH");
misha.addCreditAccount(500, 2000, 5000, new Date(2022, 8, 5), "USD");

let ira = new Client("Ira", false, new Date(2020, 7, 9));
ira.addDebitAccount(2000, new Date(2022, 5, 20), "USD");

console.log(misha);
console.log(ira);
console.log(Client.clientBase);
