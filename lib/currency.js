'use strict';

var request = require('request');
var _ = require('lodash');

function CurrencyController(options) {
  this.node = options.node;
  var refresh = options.currencyRefresh || CurrencyController.DEFAULT_CURRENCY_DELAY;
  this.currencyDelay = refresh * 60000;
  this.exchange_rates = {
    xmcc_usd: 0.00,
    btc_usd: 0.00,
    btc_xmcc: 0.00
  };
  this.timestamp = Date.now();
}

CurrencyController.DEFAULT_CURRENCY_DELAY = 10;

CurrencyController.prototype.index = function(req, res) {
  var self = this;
  var currentTime = Date.now();
  if (self.exchange_rates.btc_xmcc === 0.00 || currentTime >= (self.timestamp + self.currencyDelay)) {
    self.timestamp = currentTime;

    var requestCryptopia = {
        method: 'GET',
        agent: false,
    	headers: {
	    'User-Agent': 'Mozilla/4.0 (compatible; insight-api-monoeci)',
            'Content-type': 'application/x-www-form-urlencoded'
	},
	uri: 'https://www.cryptopia.co.nz/api/GetMarkets'
    };

    request(requestCryptopia , function(err, response, body) {
      if (err) {
        self.node.log.error(err);
      }
      if (!err && response.statusCode === 200) {
        var response = JSON.parse(body);

	var xmcc_btc = _.find(response.Data, function(i) { return i.Label == "XMCC/BTC"}.bind(this));
	var btc_usd = _.find(response.Data, function(i) { return i.Label == "BTC/USDT"}.bind(this))

	self.exchange_rates.btc_xmcc = xmcc_btc.LastPrice;
	self.exchange_rates.btc_usd = btc_usd.LastPrice;
        self.exchange_rates.xmcc_usd = (xmcc_btc.LastPrice * btc_usd.LastPrice);
	self.exchange_rates.bitstamp = self.exchange_rates.xmcc_usd; // backwards compatibility
      }
      res.jsonp({
        status: 200,
        data: self.exchange_rates
      });
    });
  } else {
    res.jsonp({
      status: 200,
      data: self.exchange_rates
    });
  }

};

module.exports = CurrencyController;
