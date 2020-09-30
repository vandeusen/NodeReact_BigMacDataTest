const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const request = require('request');
const port = process.env.PORT || 5000;
const fs = require('fs');
const neatCsv = require('neat-csv');
const userLocale = require('get-user-locale');
var currencyFormatter = require('currency-formatter');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(requestIp.mw({attributeName : 'externalIp'}));

app.get('/api/fetchIP', (req, res) => {
    //ip address is hard-coded because running the project locally causes req.ip and requestIp.mw({attributeName : 'externalIp'}) to always return 127.0.0.1 or ::1 rather than proper external IP address
    let url = 'https://ipvigilante.com/json/72.229.28.185/country_name'
    req.pipe(request(url)).pipe(res);
});

app.post('/api/checkBigMac', (req, res) => {
  //console.log(req.body);
  let userCurrency = req.body.post;
  let cleanUserCurrency = currencyFormatter.unformat(userCurrency, { locale: userLocale.getUserLocale() });
  let userCountry = req.body.country;
  const reducer = (accumulator, currentValue) => accumulator + currentValue;

  function getAveragePrice(matchingRowsArray, fieldToAverage)
  {
    let localPrices = matchingRowsArray.map(x => parseInt(x[fieldToAverage]));
    let totalLocalPrices = localPrices.reduce(reducer);
    let averageLocalPrice = totalLocalPrices / localPrices.length;
    return averageLocalPrice;
  }

  function getNumBigMacs(matchingRowsArray)
  {
    let numBigMacs = cleanUserCurrency / getAveragePrice(matchingRowsArray, 'Local price');
    return numBigMacs;
  }

  function getLocalPPP(matchingRowsArray)
  {
    let localPPP = matchingRowsArray.map(x => parseInt(x['Dollar PPP']));
    let totalLocalPPP = localPPP.reduce(reducer);
    let averageLocalPPP = totalLocalPPP / localPPP.length;
    return averageLocalPPP;
  }

  function getRandomCountry(collection) {
    let keys = Array.from(collection.keys());
    return keys[Math.floor(Math.random() * keys.length)];
    
  }

  function getRandomCountryNumBigMacs(randomCountryMatchingRowsArray, localNumBigMacs, localAveragePrice)
  {
    let averageRCDollarPrice = getAveragePrice(randomCountryMatchingRowsArray, 'Dollar price');
    let numRCBigMacs = localNumBigMacs * (localAveragePrice/averageRCDollarPrice);
    return numRCBigMacs;
  }

  function getRandomCountryExchangeRate(localAveragePrice, randomCountryAveragePrice)
  {
    return cleanUserCurrency * ( localAveragePrice / randomCountryAveragePrice);
  }

    fs.readFile('./data/big-mac-index.csv', async (error, data) => {
        if (error) {
          return console.log('error reading file');
        }
        const parsedData = await neatCsv(data);
        let matchingRows = parsedData.filter(x => x.Country === userCountry);

        let DistinctCountries = new Set(parsedData.map(x => x.Country));
        DistinctCountries.delete(userCountry);
        let randomCountry = getRandomCountry(DistinctCountries);
        let randomCountryMatch = parsedData.filter(x => x.Country === randomCountry);

        res.send(
            '<div class="formResult"><div class="yourCountryWrapper"><div>You could buy '+getNumBigMacs(matchingRows).toFixed(4)+' of Big Macs in your country</div><div>Your Dollar Purchasing Parity (PPP) is '+getLocalPPP(matchingRows)+'</div></div><div class="randomCountryWrapper"><div>Random Country: '+randomCountry+'</div><div>You could buy '+getRandomCountryNumBigMacs(randomCountryMatch,getNumBigMacs(matchingRows),getAveragePrice(matchingRows, 'Local price')).toFixed(4)+' of Big Macs in '+randomCountry+'</div><div>Your '+userCurrency+' is worth about '+currencyFormatter.format(getRandomCountryExchangeRate(getAveragePrice(matchingRows, 'Local price'),getAveragePrice(randomCountryMatch, 'Dollar price')), { locale: userLocale.getUserLocale() })+' in '+randomCountry+'</div></div></div>'
        );
       //console.log(randomCountry);
      });

});

app.listen(port);