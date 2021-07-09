import { createRequire } from 'module';
const require = createRequire(import.meta.url);

var axios = require('axios');
var CryptoJS = require("crypto-js");

export default class ApiClass
{
    constructor(apiKey, secret, token=null)
    {
        this.apiKey = apiKey;
        this.secret = secret;
        this.token = token;
        this.tries = 0;
    }
    
    async getTimestamp()
    {
        var config = {
            method: 'get',
            url: 'https://api.binance.com/api/v3/time',
        };

        return await axios(config)
        .then(function (response) {
            return response.data.serverTime;
        })
        .catch(error => {
            await this.handleError(error, 'getTimeStamp', this.getTimestamp);
        });
    }

    async getPrice(symbol)
    {
        var config = {
            method: 'get',
            url: `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
            headers: { 
              'Content-Type': 'application/json'
            }
          };

        return await axios(config)
          .then(response => {
              console.log(symbol + ' is priced at: ' + response.data.price);
              return response.data.price;
          })
          .catch(error => {
                await this.handleError(error, 'getPrice', this.getPrice, [symbol]);
          });
    }

    async setOrder(protocol, buyToken, qty)
    {
        let symbol = this.token === 'USDT' ? buyToken + this.token : this.token + buyToken;
        let balance = this.token === 'USDT' ? qty / await this.getPrice(symbol) : qty;
        console.log('balance = ' + balance);
        let timestamp = await this.getTimestamp();
        const urlStr = `symbol=${symbol}&side=${protocol}&type=MARKET&quantity=${Math.floor(balance)}&timestamp=${timestamp}`;
        const signature = CryptoJS.HmacSHA256(urlStr, this.secret);
        
        var config = {
            method: 'post',
            url: `https://api.binance.com/api/v3/order?${urlStr}&signature=${signature}`,
            headers: {
                'Content-Type': 'application/json',
                'X-MBX-APIKEY': this.apiKey
            }
        };

        return await axios(config)
        .then(function (response) {
            console.log(response.data);
        })
        .catch(error => {
            await this.handleError(error, 'setOrder', this.setOrder, [protocol, buyToken, qty]);
        });
    }

    async setLimitOrder(targetPrice)
    {
        let timestamp = await this.getTimestamp();
        const urlStr = `symbol=DOGEUSDT&side=SELL&type=LIMIT&timeInForce=GTC&quantity=${Math.floor(await this.getBalance())}&price=${targetPrice.toFixed(4)}&timestamp=${timestamp}`
        const signature = CryptoJS.HmacSHA256(urlStr, this.secret);

        var config = {
            method: 'post',
            url: `https://api.binance.com/api/v3/order?${urlStr}&signature=${signature}`,
            headers: {
                'Content-Type': 'application/json',
                'X-MBX-APIKEY': this.apiKey
            }
        };

        axios(config)
        .then(function (response) {
            console.log(response.data);
        })
        .catch(error => {
            await this.handleError(error, 'setLimitOrder', this.setLimitOrder, [targetPrice]);
        });
    }

    async checkOpenOrders() 
    {
        let timestamp = await this.getTimestamp();

        const signature = CryptoJS.HmacSHA256(`symbol=DOGEUSDT&timestamp=${timestamp}`, this.secret);
        var config = {
            method: 'get',
            url: `https://api.binance.com/api/v3/openOrders?symbol=DOGEUSDT&timestamp=${timestamp}&signature=${signature}`,
            headers: {
                'Content-Type': 'application/json',
                'X-MBX-APIKEY': this.apiKey
            }
        };

        return await axios(config)
        .then(function (response) {
            return response.data.length;
        })
        .catch(error => {
            await this.handleError(error, 'checkOpenOrders', this.checkOpenOrders);
        });
    }

    async getBalance()
    {
        let timestamp = await this.getTimestamp();
        const signature = CryptoJS.HmacSHA256(`timestamp=${timestamp}`, this.secret);
        var config = {
            method: 'get',
            url: `https://api.binance.com/api/v3/account?timestamp=${timestamp}&signature=${signature}`,
            headers: {
                'Content-Type': 'application/json',
                'X-MBX-APIKEY': this.apiKey
            }
        };

        return await axios(config)
        .then(response => {
            for(let balance of response.data.balances)
            {
                if(balance.asset === this.token)
                {
                    console.log('current ' + this.token +' balance: ' + balance.free);
                    return balance.free;
                }
            }
            
        })
        .catch(error => {
            await this.handleError(error, 'getBalance', this.getBalance);
        });
    }

    async handleError(error, str, callback, args)
    {
        if(this.tries < 5)
        {
            console.log(error);
            console.log(`Trying ${str} function again...`);
            this.tries++;
            return await callback.apply(this, args);
        } else
        {
            throw new Error;
        }

    }
}