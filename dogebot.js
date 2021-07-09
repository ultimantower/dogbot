import HandleYaml from './HandleYaml.js';
import ApiClass from './ApiClass.js';
import PuppeteerClass from './PuppeteerClass.js';

//Tradebot to purchase Doge when Elon Musk tweets about Doge.

const apiKey = //input Binance api key;
const secret = //input Binance secret;

const initFunction = async() => { 

    const handleYaml = new HandleYaml;
    let data = await handleYaml.getData();

    if(data.cycle_completed)
    {
        console.log('cycle completed!');
        return
    }

    if(!data.doge_found)
    {
        if(await new PuppeteerClass().goToUrl())
        {
            data.doge_found = true;
            await orderFunction('HBAR', 'USDT');
            await orderFunction('USDT', 'DOGE');
            data.target_price = await setLimitOrder();
            handleYaml.writeData(data);
        }
    } else
    {
        if (await new ApiClass(apiKey, secret).checkOpenOrders())
        {
            console.log('Order not yet filled, target price: ' + data.target_price);
        } else
        {
            await orderFunction('USDT', 'HBAR');
            console.log('Returning to HBAR.');
            data.cycle_completed = true;
            handleYaml.writeData(data);
        }
    }
}

const orderFunction = async(sellToken, buyToken) => {

    const apiClass = new ApiClass(apiKey, secret, sellToken);
    let balance = await apiClass.getBalance();
    await apiClass.setOrder('SELL', buyToken, balance);

}

const setLimitOrder = async() => {

    const apiClass = new ApiClass(apiKey, secret, 'DOGE');
    let targetPrice = (await apiClass.getPrice('DOGEUSDT')) * 1.2;
    apiClass.setLimitOrder(targetPrice);
    return targetPrice;
}

initFunction();
