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

                        console.log('user id : ====>>>>>>>>>>> ',order[orderIndex]['user_id'] );
                        
                        let quantity   =   parseFloat(order[orderIndex]['quantity']);
                        let order_id   =   order[orderIndex]['_id'].toString();
                        let user_id    =   order[orderIndex]['user_id'];
                        let buy_symbol =   order[orderIndex]['buy_symbol']
                        let use_wallet =   order[orderIndex]['use_wallet']
                        console.log('buy symbol =============>>>>>>>>>>>>>>>>>>>>>>>', buy_symbol )

                        helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order send for buy' )//insert the ordeer log  

                        let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                        if(userApiKeyDetails.length == 0 ){

                            return true 
                        }
                        let apiKey     =   userApiKeyDetails[0]['apiKey']
                        let secretKey  =   userApiKeyDetails[0]['secretKey']
                        
                        console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                        console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])
                        
                        const binance = new Binance().options({
                            APIKEY      :   apiKey,
                            APISECRET   :   secretKey
                        });

                        helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order ready for buy' )//insert the ordeer log  
                        
                        if(order[orderIndex]['quantity_behaviour'] == 'coins'){
                            if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT' ){
                                try{

                                    //    let responseBuy  =  await helperCon.selBinanceCall(buy_symbol, quantity, apiKey, secretKey)   
                                    //    let responseSell =  await helperCon.buyBinaneCall(buy_symbol, quantity, apiKey, secretKey )
                                   let response = await binance.marketBuy(buy_symbol, quantity)
                                    let newObjectSet = {
                                        purchased_price_buy_symbol  :   parseFloat(response.price),
                                        status                      :   response.status,
                                        order_type                  :   response.type,
                                        executedQty                 :   parseFloat(response.executedQty),
                                        binance_order_id            :   response.orderId,
                                        order_filled_time           :   new Date()
                                    }
                                    await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                    await helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order successfully buy' )//insert the ordeer log  
                                }catch(error){
                                    
                                    console.log('error-----------------------------------------------------------------------')
                                    let newObjectSet = {
                                        status     :   'ERROR',
                                    }
                                    await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                    await helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log  
                                    // console.log('error ======>>>>>>>>>>>', error)
                                }
                            }else{
                                if( buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                                    try{
                                        let symbolPrice = await helperCon.getMarketPrice(buy_symbol, 'market_prices_binance')
                                        console.log('symbolPrice.price=====>>>>>>>>>>>>>>', symbolPrice.price);

                                        let responseSell = await binance.marketSell(use_wallet , quantity);
                                        let newObjectSet = {
                                            purchased_price_buy_symbol  :   parseFloat(symbolPrice.price),
                                            status                      :   'FILLED',
                                            order_type                  :   'MARKET',
                                            executedQty                 :   quantity,
                                            binance_order_id            :   '',
                                            order_filled_time           :   new Date()
                                        }
                                        await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                        await helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy successfully' )//insert the ordeer log 
                                
                                    }catch(error){
                                        helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log   
                                        let newObjectSet = {

                                            status      :   'ERROR',
                                        }
                                        await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                        console.log('error-----------------------------------------------------------------------')
                                        // console.log(error)
                                    }
                                } else {
                                    try{
                                        let sellBinance = await binance.marketSell(use_wallet , quantity);
                                        try{
                                            let response = await binance.marketBuy(buy_symbol, quantity)
                                            await helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy successfully' )//insert the ordeer log 
                                            let newObjectSet = {
                                                purchased_price_buy_symbol  :  parseFloat(response.price),
                                                status                      :   response.status,
                                                order_type                  :   response.type,
                                                executedQty                 :   parseFloat(response.executedQty),
                                                binance_order_id            :   response.orderId,
                                                order_filled_time           :   new Date()
                                            }
                                            await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                        }catch(error){

                                            await helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log   
                                            let newObjectSet = {
                                                status      :   'ERROR',
                                            }
                                            await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                            // console.log('inner error =========>>>>>>>>>>>>>>>>>>>>>>>>', error)
                                            console.log('error-----------------------------------------------------------------------')
                                        }
                                    }catch(error){

                                        await helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log   
                                        let newObjectSet = {
                                            status      :   'ERROR',
                                        }
                                        await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                        // console.log('error outer ======>>>>>>>>>>>>>>>>>>>>>>>>>>', error)
                                        console.log('error-----------------------------------------------------------------------')
                                    }      
                                }
                            }
                            helperCon.balanceUpdate(user_id);
                        }else if(order[orderIndex]['quantity_behaviour'] == 'usd'){

                            if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){

                                let symbolPrice = await helperCon.getMarketPrice(buy_symbol, 'market_prices_binance')
                                console.log('symbolPrice.price=====>>>>>>>>>>>>>>', symbolPrice.price);
                                let quantityBuy = (symbolPrice.price) * quantity ;
                                console.log('buy quantity find ======>>>>>>>>>>>>>>>>>>>>>>>>>', quantityBuy)
                                try{
                                    let response = await binance.marketBuy(buy_symbol, quantityBuy)
                                    let newObjectSet = {
                                        purchased_price_buy_symbol  :   parseFloat(response.price),
                                        status                      :   response.status,
                                        order_type                  :   response.type,
                                        executedQty                 :   parseFloat(response.executedQty),
                                        binance_order_id            :   response.orderId,
                                        order_filled_time           :   new Date()
                                    }
                                    await helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy successfully' )//insert the ordeer log 
                                    await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                }catch(error){

                                    await helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log   
                                    let newObjectSet = {
                                        status      :   'ERROR',
                                    }
                                    await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                    console.log(error)
                                    // console.log('error-----------------------------------------------------------------------')
                                }
                            }else{

                                let symbolPrice = await helperCon.getMarketPrice(buy_symbol, 'market_prices_binance')
                                console.log('symbolPrice.price=====>>>>>>>>>>>>>>', symbolPrice.price);
                                let quantitysell = (symbolPrice.price) * quantity;
                                if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT' ){
                                    try{
                                        let responseSell = await binance.marketSell(use_wallet , quantitysell);
                                        await helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy successfully' )//insert the ordeer log 
                                        let newObjectSet = {
                                            purchased_price_buy_symbol  :   symbolPrice.price,
                                            status                      :   'FILLED',
                                            order_type                  :   'MARKET',
                                            executedQty                 :   quantity,
                                            binance_order_id            :   '',
                                            order_filled_time           :   new Date()
                                        }
                                        await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                    }catch(error){

                                        await helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log   
                                        let newObjectSet = {
                                            status      :   'ERROR',
                                        }
                                        await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                        // console.log(error)
                                        console.log('error-----------------------------------------------------------------------')
                                    }
                                }else{
                                    try{
                                        let sellBinance = await binance.marketSell(use_wallet , quantitysell);
                                        try{
                                            let response = await binance.marketBuy(buy_symbol, quantitysell)
                                            await helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy successfully' )//insert the ordeer log 
                                            let newObjectSet = {
                                                purchased_price_buy_symbol  :   response.price,
                                                status                      :   response.status,
                                                order_type                  :   response.type,
                                                executedQty                 :   response.executedQty,
                                                binance_order_id            :   response.orderId,
                                                order_filled_time           :   new Date()
                                            }
                                            await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                        }catch(error){

                                            await helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log   
                                            let newObjectSet = {
                                                status      :   'ERROR',
                                            }
                                            await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                            // console.log('inner error =========>>>>>>>>>>>>>>>>>>>>>>>>', error)
                                            console.log('error-----------------------------------------------------------------------')
                                        }
                                    }catch(error){

                                        await helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log   
                                        let newObjectSet = {
                                            status      :   'ERROR',
                                        }
                                        await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                        // console.log('error outer ======>>>>>>>>>>>>>>>>>>>>>>>>>>', error)
                                        console.log('error-----------------------------------------------------------------------')
                                    }     
                                }//end else
                            }
                        }else if(order[orderIndex]['quantity_behaviour'] == 'percentage'){
                            
                            let percentageCount  =  await helperCon.getBalancePercentage(user_id, use_wallet, quantity);  
                            console.log('percentageCount====>>>>>>>>>>>>>>>>> ', percentageCount ) 
                           
                            if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                try{
                                    
                                    let response = await binance.marketBuy(buy_symbol, percentageCount)
                                    let newObjectSet = {
                                        purchased_price_buy_symbol  :   parseFloat(response.price),
                                        status                      :   response.status,
                                        order_type                  :   response.type,
                                        executedQty                 :   parseFloat(response.executedQty),
                                        binance_order_id            :   response.orderId,
                                        order_filled_time           :   new Date()
                                    }
                                    await helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy successfully' )//insert the ordeer log 
                                    await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                }catch(error){
                                    helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log   
                                    let newObjectSet = {
                                        status      :   'ERROR',
                                    }
                                    await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                    // console.log(error)
                                    console.log('error-----------------------------------------------------------------------')
                                }
                            }else{
                                
                                if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT' ){
                                    try{
                                        let responseSell = await binance.marketSell(use_wallet , quantitysell);
                                        let newObjectSet = {
                                            purchased_price_buy_symbol  :   symbolPrice.price,
                                            status                      :   'FILLED',
                                            order_type                  :   'MARKET',
                                            executedQty                 :   quantity,
                                            binance_order_id            :   '',
                                            order_filled_time           :   new Date()
                                        }
                                        await helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy successfully' )//insert the ordeer log 
                                        await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                    }catch(error){
                                        helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log   
                                        let newObjectSet = {
                                            status      :   'ERROR',
                                        }
                                        await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                        // console.log(error)
                                        console.log('error-----------------------------------------------------------------------')
                                    }
                                }else{
                                    try{
                                        let responseSell = await binance.marketSell( use_wallet , percentageCount) ;
                                        try{
                                            let responseBuy = await binance.marketBuy( use_wallet , percentageCount) ;
                                            let newObjectSet = {
                                                purchased_price_buy_symbol  :   responseBuy.price,
                                                status                      :   responseBuy.status,
                                                order_type                  :   responseBuy.type,
                                                executedQty                 :   responseBuy.executedQty,
                                                binance_order_id            :   responseBuy.orderId,
                                                order_filled_time           :   new Date()
                                            }
                                            await helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy successfully' )//insert the ordeer log 
                                            await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                        }catch(error){

                                            await helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log   
                                            let newObjectSet = {
                                                status      :   'ERROR',
                                            }
                                            await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                            // console.log(error)
                                            console.log('error-----------------------------------------------------------------------')
                                        }
                                    }catch(error){
                                        await helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log   
                                        let newObjectSet = {
                                            status      :   'ERROR',
                                        }
                                        await helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                        // console.log(error)
                                        console.log('error-----------------------------------------------------------------------')
                                    }
                                }
                            }
                        }else{

                            console.log('order behaviour is missing we cannot process this order for now sorry!!!!!!!!!')
                            return true;
                        }

                        await helperCon.balanceUpdate(user_id);//for balance update 
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