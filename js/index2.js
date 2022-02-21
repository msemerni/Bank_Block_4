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
// Аналогично для активных. Для получения актуальных курсов валют использовать API (https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5). 
// Промисы использовать для работы с API в целях отправки запросов на сервер.
// Создать отдельный git-репозиторий для этого проекта и дальше работать с этим проектом в этом репозитории.


class Client {
  static id = 1;
  constructor(fullName, isActive, registrationDate, debitAccount, creditAccount) {
    this.id = Client.id++;
    this.fullName = fullName;
    this.isActive = isActive;
    this.registrationDate = registrationDate;
    this.debitAccount = {};
    this.creditAccount = {};
  }
    addDebitAccount(balance, isActive, activityDate, expiredDate, currencyType) {

    }
  
}



class Account {
  constructor(debitAccount, creditAccount) {
    this.debitAccount = debitAccount;
    this.creditAccount = creditAccount;
  }
}



let q1 = new Client("Misha", true, "21.02.2022", 25, 38);
let q2 = new Client("Ira", false, "15.01.2020");
let q3 = new Client("Valera", false, "08.02.2021");
let q4 = new Client("Nadya", true, "05.08.2019");
console.log(q1);
console.log(q2);
console.log(q3);
console.log(q4);

let clientBase = [];
function addClientToBank (client) {
  clientBase.push(client);
}

addClientToBank(q1);
addClientToBank(q2);
addClientToBank(q3);
addClientToBank(q4);

console.log(clientBase);
