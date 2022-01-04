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
                        
                        helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order send for sell' )//insert the ordeer log  
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
                            if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                try{
                                    let response = await binance.marketBuy(buy_symbol, quantity)
                                    
                                    let newObjectSet = {
                                        purchased_price_buy_symbol  :   parseFloat(response.price),
                                        status                      :   response.status,
                                        order_type                  :   response.type,
                                        executedQty                 :   parseFloat(response.executedQty),
                                        binance_order_id            :   response.orderId,
                                        order_filled_time           :   new Date()
                                    }
                                    helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order successfully buy' )//insert the ordeer log  
                                    helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                }catch(error){

                                    helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log  
                                    let newObjectSet = {
                                        status                      :   'ERROR',
                                    }
                                    helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                    console.log(error)
                                }
                            }else{
                                if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT' ){
                                    try{
                                       let response = await binance.marketSell(use_wallet, quantity)
                                       let symbolPrice = await helperCon.getMarketPrice(buy_symbol, 'market_prices_binance')
                                       console.log('symbolPrice.price=====>>>>>>>>>>>>>>', symbolPrice.price);

                                        let newObjectSet = {
                                            purchased_price_buy_symbol  :   symbolPrice.price,
                                            status                      :   'FILLED',
                                            order_type                  :   'MARKET',
                                            executedQty                 :   quantity,
                                            binance_order_id            :   '',
                                            order_filled_time           :   new Date()
                                        }
                                        helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order successfully buy' )//insert the ordeer log  
                                        helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                    }catch(error){

                                        helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log  
                                        let newObjectSet = {
                                            status                      :   'ERROR',
                                        }
                                        helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                        console.log('error ======>>>>>>>>>>>', error)
                                    }
                                }else{
                                   
                                    try{
                                        let sellBinance = await binance.marketSell(use_wallet , quantity);
                                        try{
                                            let response = await binance.marketBuy(buy_symbol, quantity)
                                            let newObjectSet = {
                                                purchased_price_buy_symbol  :   parseFloat(response.price),
                                                status                      :   response.status,
                                                order_type                  :   response.type,
                                                executedQty                 :   parseFloat(response.executedQty),
                                                binance_order_id            :   response.orderId,
                                                order_filled_time           :   new Date()
                                            }
                                            helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order successfully buy' )//insert the ordeer log  
                                            helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                        }catch(error){
    
                                            helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log  
                                            let newObjectSet = {
                                                status                      :   'ERROR',
                                            }
                                            helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                            console.log('inner error =========>>>>>>>>>>>>>>>>>>>>>>>>', error)
                                        }
                                    }catch(error){
                                        helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log  
                                        let newObjectSet = {
                                            status                      :   'ERROR',
                                        }
                                        helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                        console.log('error outer ======>>>>>>>>>>>>>>>>>>>>>>>>>>', error)
                                    }      
                                }
                            }
                            helperCon.balanceUpdate(user_id);
                        }else if(sellOrder[orderIndex]['quantity_behaviour'] == 'usd'){
                            
                            let symbolPrice = await helper.getMarketPrice(use_wallet, 'market_prices_binance')
                            console.log('symbolPrice.price=====>>>>>>>>>>>>>>', symbolPrice.price);
                            let quantityBuy = symbolPrice.price * quantity ;
                            
                            if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
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
                                    helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order successfully buy' )//insert the ordeer log  
                                    helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                }catch(error){

                                    helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log  
                                    let newObjectSet = {
                                        status                      :   'ERROR',
                                    }
                                    helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                    console.log(error);
                                }
                            }else{
                                if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                                    try {
                                        let response = await binance.marketSell(use_wallet, quantityBuy)
                                        let symbolPrice = await helper.getMarketPrice(buy_symbol, 'market_prices_binance')

                                        let newObjectSet = {
                                            purchased_price_buy_symbol  :   symbolPrice.price,
                                            status                      :   'FILLED',
                                            order_type                  :   'MARKET',
                                            executedQty                 :   quantityBuy,
                                            binance_order_id            :   '',
                                            order_filled_time           :   new Date()
                                        }
                                        helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order successfully buy' )//insert the ordeer log  
                                        helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                    }catch(error) {

                                        helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log  
                                        let newObjectSet = {
                                            status                      :   'ERROR',
                                        }
                                        helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                        console.log(error)
                                    }
                                }else{
                                    try{
                                        let response = await binance.marketSell(use_wallet, quantityBuy)
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
                                            helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order successfully buy' )//insert the ordeer log  
                                            helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                        }catch(error){

                                            helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log  
                                            let newObjectSet = {
                                                status                      :   'ERROR',
                                            }
                                            helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                            console.log(error)
                                        }
                                    }catch(error){

                                        helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log  
                                        let newObjectSet = {
                                            status                      :   'ERROR',
                                        }
                                        helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                        console.log(error)
                                    }
                                }
                            }
                        }else if(sellOrder[orderIndex]['quantity_behaviour'] == 'percentage'){

                            let percentage  =  await helperCon.getBalancePercentage(user_id, buy_symbol, quantity);  // in this case buy_symbol mean sell this and use wallet mean buy this 
                            if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                try{
                                    let response = await binance.marketBuy(buy_symbol , percentage)
                                    let newObjectSet = {
                                        purchased_price_buy_symbol  :   parseFloat(response.price),
                                        status                      :   response.status,
                                        order_type                  :   response.type,
                                        executedQty                 :   parseFloat(response.executedQty),
                                        binance_order_id            :   response.orderId,
                                        order_filled_time           :   new Date()
                                    }
                                    helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order successfully buy' )//insert the ordeer log  
                                    helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                }catch(error){

                                    helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' )//insert the ordeer log  
                                    let newObjectSet = {
                                        status                      :   'ERROR',
                                    }
                                    helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                    console.log(error)
                                }
                            }else{
                                
                                if(buy_symbol == 'BTCUSDT' ||  buy_symbol == 'BUSDUSDT' ){

                                    let response = await binance.marketSell(use_wallet, percentage)
                                    let symbolPrice = await helper.getMarketPrice(buy_symbol, 'market_prices_binance')

                                    let newObjectSet = {
                                        purchased_price_buy_symbol  :   symbolPrice.price,
                                        status                      :   'FILLED',
                                        order_type                  :   'MARKET',
                                        executedQty                 :   percentage,
                                        binance_order_id            :   '',
                                        order_filled_time           :   new Date()
                                    }
                                    helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order successfully buy' )//insert the ordeer log  
                                    helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                }else{
                                    try{
                                        let response = await binance.marketSell(use_wallet, percentage)
                                        try{
                                            let response = await binance.marketBuy(buy_symbol, percentage)

                                            let newObjectSet = {
                                                purchased_price_buy_symbol  :   parseFloat(response.price),
                                                status                      :   response.status,
                                                order_type                  :   response.type,
                                                executedQty                 :   parseFloat(response.executedQty),
                                                binance_order_id            :   response.orderId,
                                                order_filled_time           :   new Date()
                                            }
                                            helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order successfully buy' ) //insert the ordeer log  
                                            helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                        }catch(error){

                                            helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' ) //insert the ordeer log  
                                            let newObjectSet = {
                                                status                      :   'ERROR',
                                            }
                                            helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                            console.log(error);
                                        }
                                    }catch(error){
                                        helperCon.saveOrderLog(order_id, 'order_logs_binance', 'order buy failed due to some issue' ) //insert the ordeer log  
                                        let newObjectSet = {
                                            status                      :   'ERROR',
                                        }
                                        helperCon.updateOrder(order_id,  newObjectSet, 'order_binance')
                                        console.log(error);
                                    }
                                }
                            }                            
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