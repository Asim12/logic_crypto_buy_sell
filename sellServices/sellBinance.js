
const Binance = require('node-binance-api');
const conn = require('../DataBase/connection');
var helperCon = require("../helpers/helper");

module.exports = {

    directSell : () => {
        conn.then(async (db) => { 
            let checkStatus = await helperCon.checkTradingIsOn('binance_trading_status');
            if(checkStatus > 0){

                console.log('Trading is Off you cannot buy or sell any thing')
            }else{

                let sellOrder = await helperCon.getDirectSellOrders();
                console.log('sell order length ==============================>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', sellOrder.length);
                if(sellOrder.length > 0){
                    for(let orderIndex = 0 ; orderIndex < sellOrder.length ;  orderIndex++){

                        console.log('sell order id is : ====>>>>>>>>>>> ', sellOrder[orderIndex]['_id'] )
                        console.log('sell order buy symbol : ====>>>>>>>>>>> ', sellOrder[orderIndex]['buy_symbol'] )
                        console.log('sell order use wallet Symbol : ====>>>>>>>>>>> ', sellOrder[orderIndex]['use_wallet'] )
                        console.log('sell order quantity : ====>>>>>>>>>>> ',sellOrder[orderIndex]['quantity'] )
                        console.log('sell order behaviour : ====>>>>>>>>>>> ',sellOrder[orderIndex]['quantity_behaviour'] );
                        console.log('user id : ====>>>>>>>>>>> ',sellOrder[orderIndex]['user_id'] );
                        
                        let quantity   =   parseFloat(sellOrder[orderIndex]['quantity']);
                        let order_id   =   sellOrder[orderIndex]['_id'].toString();
                        let user_id    =   sellOrder[orderIndex]['user_id'];
                        let buy_symbol =   sellOrder[orderIndex]['buy_symbol']
                        let use_wallet =   sellOrder[orderIndex]['use_wallet']
                        
                        let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                        let apiKey     =   userApiKeyDetails[0]['apiKey']
                        let secretKey  =   userApiKeyDetails[0]['secretKey']
                        
                        console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                        console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])

                        const binance = new Binance().options({
                            APIKEY      :   apiKey,
                            APISECRET   :   secretKey
                        });

                        if(sellOrder[orderIndex]['quantity_behaviour'] == 'coins'){

                            if(buy_symbol == 'BTCUSDT' || buy_symbol == 'ETHBTC'){

                                let response = await binance.futuresMarketBuy(use_wallet, quantity)
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
                                status   :  'completed'
                            }
                            let collectionName = 'order_binance';
                            helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                        }else if(sellOrder[orderIndex]['quantity_behaviour'] == 'usd'){

                            if(buy_symbol == 'BTCUSDT' || buy_symbol == 'ETHBTC'){

                                let symbolPrice = await helper.getMarketPrice(use_wallet, 'market_prices_binance')
                                console.log('symbolPrice.price=====>>>>>>>>>>>>>>', symbolPrice.price);
                                let quantityBuy = symbolPrice.price * quantity ;

                                // let response = await binance.futuresMarketBuy(use_wallet, quantityBuy)
                                // console.log('response ===>>>>>>>>>>>>', response);
                                // db.collection('test_buy').insertOne(response)
                            }else{

                                let symbolPrice = await helper.getMarketPrice(use_wallet, 'market_prices_binance')
                                console.log('symbolPrice.price=====>>>>>>>>>>>>>>', symbolPrice.price);
                                let quantitysell = symbolPrice.price * quantity;

                                // let responseSell = await binance.futuresMarketSell( use_wallet , quantitysell) ;
                                // console.log('responseSell =>>>>>>>>>>', responseSell);

                                // let responseBuy  = await binance.futuresMarketBuy(buy_symbol, quantitysell)
                                // console.log('responseBuy =>>>>>>>>>>', responseBuy);

                                // db.collection('sell_test').insertOne(responseSell)
                                // db.collection('test_buy_else').insertOne(responseBuy)
                            }
                            
                            let newObjectSet = {
                                purchased_price_buy_symbol  : "",
                                status   :  'completed'
                            }
                            let collectionName = 'order_binance';
                            helperCon.updateOrder(order_id,  newObjectSet, collectionName)

                        }else if(sellOrder[orderIndex]['quantity_behaviour'] == 'percentage'){

                            let percentage  =  await helperCon.getBalancePercentage(user_id, buy_symbol, quantity);  // in this case buy_symbol mean sell this and use wallet mean buy this 
                            if(buy_symbol == 'BTCUSDT' || buy_symbol == 'ETHBTC'){

                                let response = await binance.futuresMarketBuy(use_wallet, percentage)
                                console.log('response ===>>>>>>>>>>>>', response);
                                db.collection('test_buy').insertOne(response)
                            }else{
                                

                                let responseSell = await binance.futuresMarketSell( use_wallet , percentage) ;
                                console.log('responseSell =>>>>>>>>>>', responseSell);

                                let responseBuy  = await binance.futuresMarketBuy(buy_symbol, percentage)
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

                            // console.log('balance percentage calculattion is ==============>>>>>>>>>>>>>>>>>>>>>>>>>>', percentage)
                        }else{

                            console.log('order behaviour is missing we cannot process this order for now sorry!!!!!!!!!')
                            return true;
                        }
                    }//end loop
                }else{

                    console.log('=========================>>>>>>>>>>>>>>>>>>>>>>> No sell Order Found <<<<<<<<<<<<<<<<<<<<<<<<<<<<======================')
                }
            }
        })
    }
}