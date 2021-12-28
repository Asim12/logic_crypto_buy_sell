
const Binance = require('node-binance-api');
const conn = require('../DataBase/connection');
var helperCon = require("../helpers/helper");

module.exports = {
    directBuy : () => {
        conn.then(async (db) => { 

            let checkStatus = await helperCon.checkTradingIsOn('binance_trading_status');
            if(checkStatus > 0){

                console.log('trading is Off you cannot buy or sell anything');
            }else{            

                let order = await helperCon.getDirectBuyOrders();
                console.log('order length ==============================>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', order.length);
                if(order.length > 0){

                    for(let orderIndex = 0 ; orderIndex < order.length ;  orderIndex++){

                        console.log('order id is : ====>>>>>>>>>>> ', order[orderIndex]['_id'] )
                        console.log('order buy symbol : ====>>>>>>>>>>> ', order[orderIndex]['buy_symbol'] )
                        console.log('order use wallet Symbol : ====>>>>>>>>>>> ', order[orderIndex]['use_wallet'] )
                        console.log('order quantity : ====>>>>>>>>>>> ',order[orderIndex]['quantity'] )
                        console.log('order behaviour : ====>>>>>>>>>>> ',order[orderIndex]['quantity_behaviour'] );
                        console.log('user id : ====>>>>>>>>>>> ',order[orderIndex]['user_id'] );
                        
                        let quantity   =   parseFloat(order[orderIndex]['quantity']);
                        let order_id   =   order[orderIndex]['_id'].toString();
                        let user_id    =   order[orderIndex]['user_id'];
                        let buy_symbol =   order[orderIndex]['buy_symbol']
                        let use_wallet =   order[orderIndex]['use_wallet']
                        
                        let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                        let apiKey     =   userApiKeyDetails[0]['apiKey']
                        let secretKey  =   userApiKeyDetails[0]['secretKey']
                        
                        console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                        console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])

                        const binance = new Binance().options({
                            APIKEY      :   apiKey,
                            APISECRET   :   secretKey
                        });

                        if(order[orderIndex]['quantity_behaviour'] == 'coins'){
                            
                            if(use_wallet == 'BTCUSDT' || use_wallet == 'ETHBTC'){
                                
                                let response = await binance.futuresMarketBuy(buy_symbol, quantity)
                                console.log('response if ===>>>>>>>>>>>>', response);
                                db.collection('test_buy').insertOne(response)
                            }else{
                                
                                let responseSell = await binance.futuresMarketSell( use_wallet , quantity) ;
                                console.log('responseSell =>>>>>>>>>>', responseSell);

                                let responseBuy  = await binance.futuresMarketBuy(buy_symbol, quantity)
                                console.log('responseBuy =>>>>>>>>>>', responseBuy);

                                db.collection('sell_test').insertOne(responseSell)
                                db.collection('test_buy_else').insertOne(responseBuy)
                            }

                            let newObjectSet = {
                                purchased_price_buy_symbol  : "",
                                status   :  'active'
                            }
                            let collectionName = 'order_binance';
                            helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                        }else if(order[orderIndex]['quantity_behaviour'] == 'usd'){

                            if(buy_symbol == 'BTCUSDT' || buy_symbol == 'ETHBTC'){

                                let symbolPrice = await helperCon.getMarketPrice(buy_symbol, 'market_prices_binance')
                                console.log('symbolPrice.price=====>>>>>>>>>>>>>>', symbolPrice.price);
                                let quantityBuy = (symbolPrice.price) * quantity ;
                                console.log('buy quantity find ======>>>>>>>>>>>>>>>>>>>>>>>>>', quantityBuy)

                                let response = await binance.futuresMarketBuy(buy_symbol, quantityBuy)
                                console.log('response ===>>>>>>>>>>>>', response);
                                db.collection('test_buy').insertOne(response)
                            }else{

                                let symbolPrice = await helperCon.getMarketPrice(buy_symbol, 'market_prices_binance')
                                console.log('symbolPrice.price=====>>>>>>>>>>>>>>', symbolPrice.price);
                                let quantitysell = (symbolPrice.price) * quantity;
                                console.log('buy quantity find ======>>>>>>>>>>>>>>>>>>>>>>>>>', quantitysell)


                                let responseSell = await binance.futuresMarketSell( buy_symbol , quantitysell) ;
                                console.log('responseSell =>>>>>>>>>>', responseSell);

                                let responseBuy  = await binance.futuresMarketBuy(buy_symbol, quantitysell)
                                console.log('responseBuy =>>>>>>>>>>', responseBuy);

                                db.collection('sell_test').insertOne(responseSell)
                                db.collection('test_buy_else').insertOne(responseBuy)
                            }
                            
                            let newObjectSet = {
                                purchased_price_buy_symbol  : "",
                                status   :  'active'
                            }
                            let collectionName = 'order_binance';
                            helperCon.updateOrder(order_id,  newObjectSet, collectionName)

                        }else if(order[orderIndex]['quantity_behaviour'] == 'percentage'){
                            
                            let percentageCount  =  await helperCon.getBalancePercentage(user_id, use_wallet, quantity);  
                            console.log('percentageCount====>>>>>>>>>>>>>>>>> ', percentageCount ) 
                           
                            if(buy_symbol == 'BTCUSDT' || buy_symbol == 'ETHBTC'){

                                let response = await binance.futuresMarketBuy(buy_symbol, percentageCount)
                                console.log('response ===>>>>>>>>>>>>', response);
                                db.collection('test_buy').insertOne(response)
                            }else{
                                
                                let responseSell = await binance.futuresMarketSell( use_wallet , percentageCount) ;
                                console.log('responseSell =>>>>>>>>>>', responseSell);

                                let responseBuy  = await binance.futuresMarketBuy(buy_symbol, percentageCount)
                                console.log('responseBuy =>>>>>>>>>>', responseBuy);

                                db.collection('sell_test').insertOne(responseSell)
                                db.collection('test_buy_else').insertOne(responseBuy)
                            }
                            
                            let newObjectSet = {
                                purchased_price_buy_symbol  : "",
                                status   :  'completed'
                            }
                            let collectionName = 'order_binance';
                            helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                        }else{

                            console.log('order behaviour is missing we cannot process this order for now sorry!!!!!!!!!')
                            return true;
                        }

                    }//end loop
                }else{

                    console.log('Buy pending are not avaliable ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
                }
            }
        })
    },//end direct buy

    tradingOnOff : () => {
        conn.then(async(db) => {

            let checkPricesIsWorking = await helperCon.checkPrices('binance')
            console.log('checkPricesIsWorking ======>>>>>>>>>>>>>>>>>', checkPricesIsWorking)

            if(checkPricesIsWorking > 0) {

                console.log('Market Prices is Stopped!');
                db.collection('binance_trading_status').updateOne({exchange : 'binance'} , {'$set' : {buy: false, sell : false}}, {upsert : true} );
            }else{
                console.log('Market Prices is Running!');
                db.collection('binance_trading_status').updateOne({exchange : 'binance'} , {'$set' : {buy: true, sell : true}}, {upsert : true} );
            }
        })
    },//end
}