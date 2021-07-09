import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');

require('events').EventEmitter.prototype._maxListeners = 100;
require('events').EventEmitter.defaultMaxListeners = 100;

export default class PuppeteerClass 
{
    constructor()
    {
        this.scrapedText = null;
        this.page = null;
        this.browser = null;
        this.hbarBalance = null;
        this.url = 'https://twitter.com/elonmusk';
    }

    async goToUrl()
    {
        console.log("Checking for doge tweets");

        const browser = await puppeteer.launch({
               ignoreHTTPSErrors: true,
               headless: true,
               defaultViewport: {width: 1920,height: 1080 },
               args: [
                   '--window-size=1920,1080',
                   '--no-sandbox', 
                   '--disable-setuid-sandbox'
               ]
        });
        this.browser = browser;
        this.page = await browser.newPage();

        await this.page._client.send('Emulation.clearDeviceMetricsOverride');
        await this.page.goto(this.url, {timeout: 10000}).catch(error => {
			return this.handleError("nav");
		});
    
        await this.page.waitForSelector('article', {timeout: 8000}).catch(error => {
              return this.handleError("nav");
        });
        console.log("hit the site!");
        
        return await this.scrapeTweets();
    }        

    async scrapeTweets()
    {
        try
        {
            await this.page.waitFor(5000);
            const data = await this.page.$$eval('article', articles => articles.map((article) => {
                return article.innerText;
            }));
            console.log(data[0]);

            this.scrapedText = data[0];

            return await this.processText();

        }catch (error)
        {
            console.log(error.message);
        }
    }

    async processText()
    {
        const index = this.scrapedText.toLowerCase().indexOf('doge');
        if (index !== -1)
        {
            await this.parseBalance();
            console.log('Doge found! Buying Doge');
            await this.browser.close();
            return true;
        } else
        {
            console.log('No doge tweets found.');
            await this.endScrape();
            return false;
        }
    }

    async endScrape()
    {
        await this.browser.close();
    }

    async handleError(type)
    {
        console.log("encountered " + type + " error, trying again");
        await this.browser.close();
        return this.goToUrl();
    }
}
