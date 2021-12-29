const Binance = require('node-binance-api');
const conn = require('../DataBase/connection');
var helperCon = require("../helpers/helper");

module.exports = {
    eventBuy : () => {
        conn.then(async (db) => { 
            let checkStatus = await helperCon.checkTradingIsOn('binance_trading_status');
            if(checkStatus > 0){

                console.log('trading is Off you cannot buy or sell anything');
            }else{ 
                 
                let order = await helperCon.getEventBuyOrders();
                console.log('event order length ==============================>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', order.length);
                if(order.length > 0){
                    for(let orderIndex = 0 ; orderIndex < order.length ;  orderIndex++){
                    
                        // console.log('order id is : ====>>>>>>>>>>> ', order[orderIndex]['_id'] );
                        // console.log('select coin : ====>>>>>>>>>>> ', order[orderIndex]['select_coin'] );
                        // console.log('has_condition : ====>>>>>>>>>>> ', order[orderIndex]['has_condition'] ); // price , volume , marketCap
                        // console.log('has_checking : ====>>>>>>>>>>> ', order[orderIndex]['has_checking'] ) // has_sorting_condition   inc,dec, lower, greater
                        // console.log('checking_value : ====>>>>>>>>>>> ', order[orderIndex]['checking_value'] )
                        // console.log('checking_symbol : ====>>>>>>>>>>> ', order[orderIndex]['checking_symbol'] );
                        // console.log('checking_time : ====>>>>>>>>>>> ', order[orderIndex]['checking_time'] )
                        // console.log('checkingStartCount : ====>>>>>>>>>>> ', order[orderIndex]['checkingStartCount'] )
                        // console.log('quantity : ====>>>>>>>>>>> ', order[orderIndex]['quantity'] )
                        // console.log('quantity_behaviour : ====>>>>>>>>>>> ', order[orderIndex]['quantity_behaviour'] )
                        // console.log('order buy symbol : ====>>>>>>>>>>> ', order[orderIndex]['buy_symbol'] )
                        // console.log('order use wallet Symbol : ====>>>>>>>>>>> ', order[orderIndex]['use_wallet'] )
                        // console.log('exchange : ====>>>>>>>>>>> ', order[orderIndex]['exchange'] )
                        // console.log('user id : ====>>>>>>>>>>> ', order[orderIndex]['user_id'] );

                        let order_id            =   order[orderIndex]['_id'];
                        let select_coin         =   order[orderIndex]['select_coin'];
                        let has_condition       =   order[orderIndex]['has_condition'];
                        let has_checking        =   order[orderIndex]['has_checking']; // sorting wala inc, dec, lower, greater
                        let checking_value      =   order[orderIndex]['checking_value']; // kitne value hoge to kry ga buy/sell
                        let checking_symbol     =   order[orderIndex]['checking_symbol']; // kis coins ke value ya jo be dekhna ha wo coin name
                        let checking_time       =   order[orderIndex]['checking_time']; // kitne deer bad dekhna ha wo time
                        let checkingStartCount  =   order[orderIndex]['checkingStartCount']; // kitne dafa is ko dekhna ha and phr expire krna ha 
                        let startTimeType       =   order[orderIndex]['startTimeType'];//time kis tara ka ha Hours ma weeks ma ha kis ma ha wo dekhna ha 
                        let quantity            =   order[orderIndex]['quantity'];// jo buy/sell kne ha wo quantity
                        let quantity_behaviour  =   order[orderIndex]['quantity_behaviour'] ; // quantity ka behaviour kia hoga mean coin, btc, usd, percentage
                        let buy_symbol          =   order[orderIndex]['buy_symbol'];
                        let use_wallet          =   order[orderIndex]['use_wallet'];
                        let exchange            =   order[orderIndex]['exchange'];
                        let user_id             =   order[orderIndex]['user_id'];
                        let created_Date        =   order[orderIndex]['created_date'];
                        let startTime           =   order[orderIndex]['startTime'];

                        let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                        let apiKey     =   userApiKeyDetails[0]['apiKey']
                        let secretKey  =   userApiKeyDetails[0]['secretKey']
                        
                        console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                        console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])

                        const binance = new Binance().options({
                            APIKEY      :   apiKey,
                            APISECRET   :   secretKey
                        });
                        let endTime = await helperCon.makeTheEndTime(startTime,  startTimeType,  checking_time ) ;

                        console.log('end time after converting the minuts =============>>>>>>>>>>>>>>>>', endTime );
                        if(endTime != false) {

                            if(has_condition == 'volume'){
                                
                                if(has_checking == 'increase'){
                                    if(checking_symbol == 'percentage'){
                                        let volume = await helperCon.getVolumeCheckingForPercentage(select_coin, created_Date, endTime, exchange);
                                        console.log('volume=============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', volume);
                                        if(volume > checking_value){
                                            if(quantity_behaviour == 'coins'){
                                                if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                                    
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }else if(quantity_behaviour == 'usd'){
                    
                                                if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                    
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1)
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                    
                                            }else if(quantity_behaviour == 'percentage'){
                                                
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1)
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }else{
                    
                                                console.log('order behaviour is missing we cannot process this order for now sorry!!!!!!!!!')
                                                return true;
                                            }
                                        }else{

                                            let newObjectSet = {

                                                checkingStartCount  :  (checkingStartCount -1),
                                                startTime           :  endTime,
                                                created_date  : new Date()
                                            }
                                            if( (checkingStartCount - 1) <= 0 ){
                                                
                                                newObjectSet['expiredForChecking'] = true ;
                                            }
                                            let collectionName = 'order_binance';
                                            helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                    }else if(checking_symbol == 'usd'){

                                        let priceDifference = helperCon.getVolumeCheckingForusd(select_coin, created_Date, endTime, 'binance');

                                        let convertIntoUSD  = '';
                                        if(select_coin == 'BUSDUSDT'){   //BUSDUSDT mean dollar price

                                            convertIntoUSD = priceDifference ;
                                        }else{

                                            let symbolPrice = await helperCon.getMarketPrice('BUSDUSDT' , 'market_prices_binance')
                                            console.log('buy symbol Price ========>>>>>>>>>>>>>>>>>>>>>>>>>', symbolPrice.price);
                                            convertIntoUSD = (symbolPrice.price > 0) ? ( (symbolPrice.price) *  priceDifference ) : 0 ;
                                        }
                                        console.log('convertIntoUSD =============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', convertIntoUSD);

                                        if(convertIntoUSD > checking_value){

                                            // let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                                            // let apiKey     =   userApiKeyDetails[0]['apiKey']
                                            // let secretKey  =   userApiKeyDetails[0]['secretKey']
                                            
                                            // console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                                            // console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])
                    
                                            // const binance = new Binance().options({
                                            //     APIKEY      :   apiKey,
                                            //     APISECRET   :   secretKey
                                            // });
                    
                                            if(quantity_behaviour == 'coins'){
                                                
                                                if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                                    
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
                                            }else if(quantity_behaviour == 'usd'){
                    
                                                if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                    
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
                    
                                            }else if(quantity_behaviour == 'percentage'){
                                                
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
                                        }else{

                                            console.log('not true')
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                    }else {  //for BTC
                                        let priceDifference = helperCon.getVolumeCheckingForusd(select_coin, created_Date, endTime, exchange);
                                        if(priceDifference != 0){

                                            let convertIntoBTC  = '';
                                            if(select_coin == 'BTCUSDT'){

                                                convertIntoBTC = priceDifference ;
                                            }else{

                                                let symbolPrice = await helperCon.getMarketPrice('BTCUSDT' , 'market_prices_binance')
                                                console.log('buy symbol Price ========>>>>>>>>>>>>>>>>>>>>>>>>>', symbolPrice.price);

                                                convertIntoBTC =  ( symbolPrice.price ) * priceDifference ;
                                            }

                                            if(convertIntoBTC > checking_value){

                                                console.log('buy the coin')
                                                return true ;
                                            }else{

                                                console.log('not True else')
                                            }
                                        }else{

                                            console.log('<<<<<<<<<<<<<<<=============   priceDifference is zero    ============>>>>>>>>>>>>>>>>>>>>')
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                        return true;
                                    }
                                }else if(has_checking == 'decrease'){
                                
                                    if(checking_symbol == 'percentage'){
                                        let volume = await helperCon.getVolumeCheckingForPercentage(select_coin, created_Date, endTime, exchange);
                                        console.log('volume=============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', volume);
                                        if(volume < checking_value && volume != 0 ){

                                            if(quantity_behaviour == 'coins'){

                                                let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                                                let apiKey     =   userApiKeyDetails[0]['apiKey']
                                                let secretKey  =   userApiKeyDetails[0]['secretKey']
                                                
                                                console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                                                console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])

                                                const binance = new Binance().options({
                                                    APIKEY      :   apiKey,
                                                    APISECRET   :   secretKey
                                                });
                            
                                                if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                                    
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }else if(quantity_behaviour == 'usd'){
                    
                                                if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                    
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                    
                                            }else if(quantity_behaviour == 'percentage'){
                                                
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }else{
                    
                                                console.log('order behaviour is missing we cannot process this order for now sorry!!!!!!!!!')
                                                return true;
                                            }
                                        }else{

                                            let newObjectSet = {
                                                checkingStartCount  :  (checkingStartCount -1),
                                                startTime           :  endTime,
                                                created_date  : new Date()
                                            }
                                            
                                            if( (checkingStartCount - 1) <= 0 ){
                                                
                                                newObjectSet['expiredForChecking'] = true ;
                                            }
                                            let collectionName = 'order_binance';
                                            helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                    }else if(checking_symbol == 'usd'){

                                        let priceDifference = await helperCon.getVolumeCheckingForusd(select_coin, created_Date, endTime, 'binance');
                                        let convertIntoUSD  = '';
                                        if(select_coin == 'ETHBTC'){

                                            convertIntoUSD = priceDifference ;
                                        }else{

                                            let symbolPrice = await helperCon.getMarketPrice(select_coin , 'market_prices_binance')
                                            console.log('buy symbol Price ========>>>>>>>>>>>>>>>>>>>>>>>>>', symbolPrice.price);
                                            convertIntoUSD = (symbolPrice.price > 0) ? ( (symbolPrice.price) *  priceDifference ) : 0 ;
                                        }
                                        console.log('convertIntoUSD =============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', convertIntoUSD);

                                        if(convertIntoUSD < checking_value &&  convertIntoUSD != 0){

                                            if(quantity_behaviour == 'coins'){

                                                let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                                                let apiKey     =   userApiKeyDetails[0]['apiKey']
                                                let secretKey  =   userApiKeyDetails[0]['secretKey']
                                                
                                                console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                                                console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])

                                                const binance = new Binance().options({
                                                    APIKEY      :   apiKey,
                                                    APISECRET   :   secretKey
                                                });
                            
                                                if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                                    
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }else if(quantity_behaviour == 'usd'){
                    
                                                if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                    
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                    
                                            }else if(quantity_behaviour == 'percentage'){
                                                
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }else{
                    
                                                console.log('order behaviour is missing we cannot process this order for now sorry!!!!!!!!!')
                                                return true;
                                            }
                                        
                                        }else{
                                            let newObjectSet = {

                                                checkingStartCount  :  (checkingStartCount -1),
                                                startTime           :  endTime,
                                                created_date  : new Date()
                                            }
                                            if( (checkingStartCount - 1) <= 0 ){
                                                
                                                newObjectSet['expiredForChecking'] = true ;
                                            }
                                            let collectionName = 'order_binance';
                                            helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                    }else {  //for BTC
                                        let priceDifference = helperCon.getVolumeCheckingForusd(select_coin, created_Date, endTime, exchange);
                                        if(priceDifference != 0){

                                            let convertIntoBTC  = '';
                                            if(select_coin == 'BTCUSDT'){

                                                convertIntoBTC = priceDifference ;
                                            }else{

                                                let symbolPrice = await helperCon.getMarketPrice(select_coin , 'market_prices_binance')
                                                console.log('buy symbol Price ========>>>>>>>>>>>>>>>>>>>>>>>>>', symbolPrice.price);

                                                convertIntoBTC =  ( symbolPrice.price ) * priceDifference ;
                                            }

                                            if(convertIntoBTC < checking_value && convertIntoBTC != 0 ){

                                                if(quantity_behaviour == 'coins'){   

                                                    let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                                                    let apiKey     =   userApiKeyDetails[0]['apiKey']
                                                    let secretKey  =   userApiKeyDetails[0]['secretKey']
                                                    
                                                    console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                                                    console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])
    
                                                    const binance = new Binance().options({
                                                        APIKEY      :   apiKey,
                                                        APISECRET   :   secretKey
                                                    });
                                
                                                    if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                                        
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
                                                        status              :  'active',
                                                        checkingStartCount  :  (checkingStartCount -1)
                                                    }
                                                    if( (checkingStartCount - 1) <= 0 ){
                                                        
                                                        newObjectSet['expiredForChecking'] = true ;
                                                    }
                                                    let collectionName = 'order_binance';
                                                    helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                                }else if(quantity_behaviour == 'usd'){
                        
                                                    if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                        
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
                                                        status              :  'active',
                                                        checkingStartCount  :  (checkingStartCount -1)
                                                    }
                                                    if( (checkingStartCount - 1) <= 0 ){
                                                        
                                                        newObjectSet['expiredForChecking'] = true ;
                                                    }
                                                    let collectionName = 'order_binance';
                                                    helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                        
                                                }else if(quantity_behaviour == 'percentage'){
                                                    
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
                                                        status              :  'active',
                                                        checkingStartCount  :  (checkingStartCount -1)
                                                    }
                                                    if( (checkingStartCount - 1) <= 0 ){
                                                        
                                                        newObjectSet['expiredForChecking'] = true ;
                                                    }
                                                    let collectionName = 'order_binance';
                                                    helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                                }else{
                        
                                                    console.log('order behaviour is missing we cannot process this order for now sorry!!!!!!!!!')
                                                    return true;
                                                }
                                            }else{

                                                let newObjectSet = {

                                                    checkingStartCount  :  (checkingStartCount -1)
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }

                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }
                                        }else{

                                            console.log('<<<<<<<<<<<<<<<=============   priceDifference is zero    ============>>>>>>>>>>>>>>>>>>>>')
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                        return true;
                                    }
                                }else if(has_checking == 'lower'){
                                    if(checking_symbol == 'percentage'){
                                        let volume = await helperCon.getVolumeCheckingForPercentage(select_coin, created_Date, endTime, exchange);
                                        console.log('volume=============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', volume);
                                        if(volume < checking_value && volume != 0 ){

                                            if(quantity_behaviour == 'coins'){

                                                let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                                                let apiKey     =   userApiKeyDetails[0]['apiKey']
                                                let secretKey  =   userApiKeyDetails[0]['secretKey']
                                                
                                                console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                                                console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])

                                                const binance = new Binance().options({
                                                    APIKEY      :   apiKey,
                                                    APISECRET   :   secretKey
                                                });
                            
                                                if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                                    
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }else if(quantity_behaviour == 'usd'){
                    
                                                if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                    
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                    
                                            }else if(quantity_behaviour == 'percentage'){
                                                
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }else{
                    
                                                console.log('order behaviour is missing we cannot process this order for now sorry!!!!!!!!!')
                                                return true;
                                            }
                                        }else{

                                            let newObjectSet = {
                                                checkingStartCount  :  (checkingStartCount -1),
                                                startTime           :  endTime,
                                                created_date  : new Date()
                                            }
                                            
                                            if( (checkingStartCount - 1) <= 0 ){
                                                
                                                newObjectSet['expiredForChecking'] = true ;
                                            }
                                            let collectionName = 'order_binance';
                                            helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                    }else if(checking_symbol == 'usd'){

                                        let priceDifference = await helperCon.getVolumeCheckingForusd(select_coin, created_Date, endTime, 'binance');
                                        let convertIntoUSD  = '';
                                        if(select_coin == 'ETHBTC'){

                                            convertIntoUSD = priceDifference ;
                                        }else{

                                            let symbolPrice = await helperCon.getMarketPrice(select_coin , 'market_prices_binance')
                                            console.log('buy symbol Price ========>>>>>>>>>>>>>>>>>>>>>>>>>', symbolPrice.price);
                                            convertIntoUSD = (symbolPrice.price > 0) ? ( (symbolPrice.price) *  priceDifference ) : 0 ;
                                        }
                                        console.log('convertIntoUSD =============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', convertIntoUSD);

                                        if(convertIntoUSD < checking_value &&  convertIntoUSD != 0){

                                            if(quantity_behaviour == 'coins'){

                                                let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                                                let apiKey     =   userApiKeyDetails[0]['apiKey']
                                                let secretKey  =   userApiKeyDetails[0]['secretKey']
                                                
                                                console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                                                console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])

                                                const binance = new Binance().options({
                                                    APIKEY      :   apiKey,
                                                    APISECRET   :   secretKey
                                                });
                            
                                                if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                                    
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }else if(quantity_behaviour == 'usd'){
                    
                                                if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                    
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                    
                                            }else if(quantity_behaviour == 'percentage'){
                                                
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }else{
                    
                                                console.log('order behaviour is missing we cannot process this order for now sorry!!!!!!!!!')
                                                return true;
                                            }
                                        
                                        }else{
                                            let newObjectSet = {

                                                checkingStartCount  :  (checkingStartCount -1),
                                                startTime           :  endTime,
                                                created_date  : new Date()
                                            }
                                            if( (checkingStartCount - 1) <= 0 ){
                                                
                                                newObjectSet['expiredForChecking'] = true ;
                                            }
                                            let collectionName = 'order_binance';
                                            helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                    }else {  //for BTC
                                        let priceDifference = helperCon.getVolumeCheckingForusd(select_coin, created_Date, endTime, exchange);
                                        if(priceDifference != 0){

                                            let convertIntoBTC  = '';
                                            if(select_coin == 'BTCUSDT'){

                                                convertIntoBTC = priceDifference ;
                                            }else{

                                                let symbolPrice = await helperCon.getMarketPrice(select_coin , 'market_prices_binance')
                                                console.log('buy symbol Price ========>>>>>>>>>>>>>>>>>>>>>>>>>', symbolPrice.price);

                                                convertIntoBTC =  ( symbolPrice.price ) * priceDifference ;
                                            }

                                            if(convertIntoBTC < checking_value && convertIntoBTC != 0 ){

                                                if(quantity_behaviour == 'coins'){   

                                                    let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                                                    let apiKey     =   userApiKeyDetails[0]['apiKey']
                                                    let secretKey  =   userApiKeyDetails[0]['secretKey']
                                                    
                                                    console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                                                    console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])
    
                                                    const binance = new Binance().options({
                                                        APIKEY      :   apiKey,
                                                        APISECRET   :   secretKey
                                                    });
                                
                                                    if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                                        
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
                                                        status              :  'active',
                                                        checkingStartCount  :  (checkingStartCount -1)
                                                    }
                                                    if( (checkingStartCount - 1) <= 0 ){
                                                        
                                                        newObjectSet['expiredForChecking'] = true ;
                                                    }
                                                    let collectionName = 'order_binance';
                                                    helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                                }else if(quantity_behaviour == 'usd'){
                        
                                                    if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                        
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
                                                        status              :  'active',
                                                        checkingStartCount  :  (checkingStartCount -1)
                                                    }
                                                    if( (checkingStartCount - 1) <= 0 ){
                                                        
                                                        newObjectSet['expiredForChecking'] = true ;
                                                    }
                                                    let collectionName = 'order_binance';
                                                    helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                        
                                                }else if(quantity_behaviour == 'percentage'){
                                                    
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
                                                        status              :  'active',
                                                        checkingStartCount  :  (checkingStartCount -1)
                                                    }
                                                    if( (checkingStartCount - 1) <= 0 ){
                                                        
                                                        newObjectSet['expiredForChecking'] = true ;
                                                    }
                                                    let collectionName = 'order_binance';
                                                    helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                                }else{
                        
                                                    console.log('order behaviour is missing we cannot process this order for now sorry!!!!!!!!!')
                                                    return true;
                                                }
                                            }else{

                                                let newObjectSet = {

                                                    checkingStartCount  :  (checkingStartCount -1)
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }

                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }
                                        }else{

                                            console.log('<<<<<<<<<<<<<<<=============   priceDifference is zero    ============>>>>>>>>>>>>>>>>>>>>')
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                        return true;
                                    }
                                }else if(has_checking == 'greater'){

                                    if(checking_symbol == 'percentage'){
                                        let volume = await helperCon.getVolumeCheckingForPercentage(select_coin, created_Date, endTime, exchange);
                                        console.log('volume=============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', volume);
                                        if(volume > checking_value){
                                            if(quantity_behaviour == 'coins'){
                                                if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                                    
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }else if(quantity_behaviour == 'usd'){
                    
                                                if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                    
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1)
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                    
                                            }else if(quantity_behaviour == 'percentage'){
                                                
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1)
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }else{
                    
                                                console.log('order behaviour is missing we cannot process this order for now sorry!!!!!!!!!')
                                                return true;
                                            }
                                        }else{

                                            let newObjectSet = {

                                                checkingStartCount  :  (checkingStartCount -1),
                                                startTime           :  endTime,
                                                created_date  : new Date()
                                            }
                                            if( (checkingStartCount - 1) <= 0 ){
                                                
                                                newObjectSet['expiredForChecking'] = true ;
                                            }
                                            let collectionName = 'order_binance';
                                            helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                    }else if(checking_symbol == 'usd'){

                                        let priceDifference = helperCon.getVolumeCheckingForusd(select_coin, created_Date, endTime, 'binance');

                                        let convertIntoUSD  = '';
                                        if(select_coin == 'BUSDUSDT'){   //BUSDUSDT mean dollar price

                                            convertIntoUSD = priceDifference ;
                                        }else{

                                            let symbolPrice = await helperCon.getMarketPrice('BUSDUSDT' , 'market_prices_binance')
                                            console.log('buy symbol Price ========>>>>>>>>>>>>>>>>>>>>>>>>>', symbolPrice.price);
                                            convertIntoUSD = (symbolPrice.price > 0) ? ( (symbolPrice.price) *  priceDifference ) : 0 ;
                                        }
                                        console.log('convertIntoUSD =============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', convertIntoUSD);

                                        if(convertIntoUSD > checking_value){

                                            // let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                                            // let apiKey     =   userApiKeyDetails[0]['apiKey']
                                            // let secretKey  =   userApiKeyDetails[0]['secretKey']
                                            
                                            // console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                                            // console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])
                    
                                            // const binance = new Binance().options({
                                            //     APIKEY      :   apiKey,
                                            //     APISECRET   :   secretKey
                                            // });
                    
                                            if(quantity_behaviour == 'coins'){
                                                
                                                if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                                    
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
                                            }else if(quantity_behaviour == 'usd'){
                    
                                                if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                    
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
                    
                                            }else if(quantity_behaviour == 'percentage'){
                                                
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
                                        }else{

                                            console.log('not true')
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                    }else {  //for BTC
                                        let priceDifference = helperCon.getVolumeCheckingForusd(select_coin, created_Date, endTime, exchange);
                                        if(priceDifference != 0){

                                            let convertIntoBTC  = '';
                                            if(select_coin == 'BTCUSDT'){

                                                convertIntoBTC = priceDifference ;
                                            }else{

                                                let symbolPrice = await helperCon.getMarketPrice('BTCUSDT' , 'market_prices_binance')
                                                console.log('buy symbol Price ========>>>>>>>>>>>>>>>>>>>>>>>>>', symbolPrice.price);

                                                convertIntoBTC =  ( symbolPrice.price ) * priceDifference ;
                                            }

                                            if(convertIntoBTC > checking_value){

                                                console.log('buy the coin')
                                                return true ;
                                            }else{

                                                console.log('not True else')
                                            }
                                        }else{

                                            console.log('<<<<<<<<<<<<<<<=============   priceDifference is zero    ============>>>>>>>>>>>>>>>>>>>>')
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                        return true;
                                    }
                                }
                            }else if(has_condition == 'price'){ 
                                if(has_checking == 'increase'){
                                    if(checking_symbol == 'percentage'){
                                        let volume = await helperCon.getVolumeCheckingForPercentage(select_coin, created_Date, endTime, exchange);
                                        console.log('volume=============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', volume);
                                        if(volume > checking_value){

                                            if(quantity_behaviour == 'coins'){
                                                if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                                    
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
                                            }else if(quantity_behaviour == 'usd'){
                    
                                                if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                    
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
                    
                                            }else if(quantity_behaviour == 'percentage'){
                                                
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
                                        }else{

                                            console.log('not true !!!!!!!!!!')
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                    }else if(checking_symbol == 'usd'){
                                        //coin should be USDT pairs
                                        let priceDifference = helperCon.getVolumeCheckingForusd(select_coin, created_Date, endTime, 'binance');

                                        let convertIntoUSD  = '';
                                        if(select_coin == 'BUSDUSDT'){   //BUSDUSDT mean dollar price

                                            convertIntoUSD = priceDifference ;
                                        }else{

                                            let symbolPrice = await helperCon.getMarketPrice('BUSDUSDT' , 'market_prices_binance')
                                            console.log('buy symbol Price ========>>>>>>>>>>>>>>>>>>>>>>>>>', symbolPrice.price);
                                            convertIntoUSD = (symbolPrice.price > 0) ? ( (symbolPrice.price) *  priceDifference ) : 0 ;
                                        }
                                        console.log('convertIntoUSD =============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', convertIntoUSD);

                                        if(convertIntoUSD > checking_value){

                                            console.log('buy the order')
                                            return true ;
                                        }else{

                                            console.log('usd Price not true')
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                    }else {  //for BTC
                                        //coin pair should be BTC
                                        let priceDifference = helperCon.getVolumeCheckingForusd(select_coin, created_Date, endTime, exchange);
                                        if(priceDifference != 0){
                                            let convertIntoBTC  = '';
                                            if(select_coin == 'BTCUSDT'){

                                                convertIntoBTC = priceDifference ;
                                            }else{

                                                let symbolPrice = await helperCon.getMarketPrice('BTCUSDT' , 'market_prices_binance')
                                                console.log('buy symbol Price ========>>>>>>>>>>>>>>>>>>>>>>>>>', symbolPrice.price);
                                                convertIntoBTC =  ( symbolPrice.price ) * priceDifference ;
                                            }
                                            if(convertIntoBTC > checking_value){

                                                console.log('buy the coin')
                                                return true ;
                                            }else{

                                                console.log('BTC Price not True else')
                                            }
                                        }else{

                                            console.log('<<<<<<<<<<<<<<<=============   priceDifference is zero    ============>>>>>>>>>>>>>>>>>>>>')
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                        return true;
                                    }
                                }else if(has_checking == 'decrease'){
                                
                                    if(checking_symbol == 'percentage'){
                                        let volume = await helperCon.getVolumeCheckingForPercentage(select_coin, created_Date, endTime, exchange);
                                        console.log('volume=============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', volume);
                                        if(volume < checking_value && volume != 0 ){

                                            if(quantity_behaviour == 'coins'){

                                                if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                                    
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }else if(quantity_behaviour == 'usd'){
                    
                                                if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                    
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                    
                                            }else if(quantity_behaviour == 'percentage'){
                                                
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }else{
                    
                                                console.log('order behaviour is missing we cannot process this order for now sorry!!!!!!!!!')
                                                return true;
                                            }
                                        }else{
                                            
                                            let newObjectSet = {
                                                checkingStartCount  :  (checkingStartCount -1),
                                                startTime           :  endTime,
                                                created_date  : new Date()
                                            }
                                            if( (checkingStartCount - 1) <= 0 ){
                                                
                                                newObjectSet['expiredForChecking'] = true ;
                                            }

                                            let collectionName = 'order_binance';
                                            helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                    }else if(checking_symbol == 'usd'){

                                        let priceDifference = await helperCon.getVolumeCheckingForusd(select_coin, created_Date, endTime, 'binance');
                                        let convertIntoUSD  = '';
                                        if(select_coin == 'BUSDUSDT'){

                                            convertIntoUSD = priceDifference ;
                                        }else{

                                            let symbolPrice = await helperCon.getMarketPrice('BUSDUSDT' , 'market_prices_binance')
                                            console.log('buy symbol Price ========>>>>>>>>>>>>>>>>>>>>>>>>>', symbolPrice.price);
                                            convertIntoUSD = (symbolPrice.price > 0) ? ( (symbolPrice.price) *  priceDifference ) : 0 ;
                                        }
                                        console.log('convertIntoUSD =============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', convertIntoUSD);

                                        if(convertIntoUSD < checking_value &&  convertIntoUSD != 0){

                                            if(quantity_behaviour == 'coins'){

                                                let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                                                let apiKey     =   userApiKeyDetails[0]['apiKey']
                                                let secretKey  =   userApiKeyDetails[0]['secretKey']
                                                
                                                console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                                                console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])

                                                const binance = new Binance().options({
                                                    APIKEY      :   apiKey,
                                                    APISECRET   :   secretKey
                                                });
                            
                                                if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                                    
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
                                            }else if(quantity_behaviour == 'usd'){
                    
                                                if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                    
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
                    
                                            }else if(quantity_behaviour == 'percentage'){
                                                
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
                                                    status   :  'active'
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }else{
                    
                                                console.log('order behaviour is missing we cannot process this order for now sorry!!!!!!!!!')
                                                return true;
                                            }
                                            console.log('buy the order ');
                                        }else{

                                            let newObjectSet = {

                                                checkingStartCount  :  (checkingStartCount -1)
                                            }
                                            if( (checkingStartCount - 1) <= 0 ){
                                                
                                                newObjectSet['expiredForChecking'] = true ;
                                            }

                                            let collectionName = 'order_binance';
                                            helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                    }else {  //for BTC
                                        let priceDifference = helperCon.getVolumeCheckingForusd(select_coin, created_Date, endTime, exchange);
                                        if(priceDifference != 0){

                                            let convertIntoBTC  = '';
                                            if(select_coin == 'BTCUSDT'){

                                                convertIntoBTC = priceDifference ;
                                            }else{

                                                let symbolPrice = await helperCon.getMarketPrice(select_coin , 'market_prices_binance')
                                                console.log('buy symbol Price ========>>>>>>>>>>>>>>>>>>>>>>>>>', symbolPrice.price);

                                                convertIntoBTC =  ( symbolPrice.price ) * priceDifference ;
                                            }

                                            if(convertIntoBTC < checking_value && convertIntoBTC != 0 ){

                                                if(quantity_behaviour == 'coins'){

                                                    let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                                                    let apiKey     =   userApiKeyDetails[0]['apiKey']
                                                    let secretKey  =   userApiKeyDetails[0]['secretKey']
                                                    
                                                    console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                                                    console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])
    
                                                    const binance = new Binance().options({
                                                        APIKEY      :   apiKey,
                                                        APISECRET   :   secretKey
                                                    });
                                
                                                    if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                                        
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
                                                }else if(quantity_behaviour == 'usd'){
                        
                                                    if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                        
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
                        
                                                }else if(quantity_behaviour == 'percentage'){
                                                    
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
                                            }else{
                                                let newObjectSet = {

                                                    checkingStartCount  :  (checkingStartCount -1)
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }

                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }
                                        }else{

                                            console.log('<<<<<<<<<<<<<<<=============   priceDifference is zero    ============>>>>>>>>>>>>>>>>>>>>')
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                        return true;
                                    }

                                }else if(has_checking == 'lower'){
                                    if(checking_symbol == 'percentage'){
                                        let volume = await helperCon.getVolumeCheckingForPercentage(select_coin, created_Date, endTime, exchange);
                                        console.log('volume=============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', volume);
                                        if(volume < checking_value && volume != 0 ){

                                            if(quantity_behaviour == 'coins'){

                                                if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                                    
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }else if(quantity_behaviour == 'usd'){
                    
                                                if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                    
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                    
                                            }else if(quantity_behaviour == 'percentage'){
                                                
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
                                                    status              :  'active',
                                                    checkingStartCount  :  (checkingStartCount -1),
                                                    startTime           :  endTime,
                                                    created_date  : new Date()
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }else{
                    
                                                console.log('order behaviour is missing we cannot process this order for now sorry!!!!!!!!!')
                                                return true;
                                            }
                                        }else{
                                            
                                            let newObjectSet = {
                                                checkingStartCount  :  (checkingStartCount -1),
                                                startTime           :  endTime,
                                                created_date  : new Date()
                                            }
                                            if( (checkingStartCount - 1) <= 0 ){
                                                
                                                newObjectSet['expiredForChecking'] = true ;
                                            }

                                            let collectionName = 'order_binance';
                                            helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                    }else if(checking_symbol == 'usd'){

                                        let priceDifference = await helperCon.getVolumeCheckingForusd(select_coin, created_Date, endTime, 'binance');
                                        let convertIntoUSD  = '';
                                        if(select_coin == 'BUSDUSDT'){

                                            convertIntoUSD = priceDifference ;
                                        }else{

                                            let symbolPrice = await helperCon.getMarketPrice('BUSDUSDT' , 'market_prices_binance')
                                            console.log('buy symbol Price ========>>>>>>>>>>>>>>>>>>>>>>>>>', symbolPrice.price);
                                            convertIntoUSD = (symbolPrice.price > 0) ? ( (symbolPrice.price) *  priceDifference ) : 0 ;
                                        }
                                        console.log('convertIntoUSD =============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', convertIntoUSD);

                                        if(convertIntoUSD < checking_value &&  convertIntoUSD != 0){

                                            if(quantity_behaviour == 'coins'){

                                                let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                                                let apiKey     =   userApiKeyDetails[0]['apiKey']
                                                let secretKey  =   userApiKeyDetails[0]['secretKey']
                                                
                                                console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                                                console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])

                                                const binance = new Binance().options({
                                                    APIKEY      :   apiKey,
                                                    APISECRET   :   secretKey
                                                });
                            
                                                if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                                    
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
                                            }else if(quantity_behaviour == 'usd'){
                    
                                                if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                    
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
                    
                                            }else if(quantity_behaviour == 'percentage'){
                                                
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
                                                    status   :  'active'
                                                }
                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }else{
                    
                                                console.log('order behaviour is missing we cannot process this order for now sorry!!!!!!!!!')
                                                return true;
                                            }
                                            console.log('buy the order ');
                                        }else{

                                            let newObjectSet = {

                                                checkingStartCount  :  (checkingStartCount -1)
                                            }
                                            if( (checkingStartCount - 1) <= 0 ){
                                                
                                                newObjectSet['expiredForChecking'] = true ;
                                            }

                                            let collectionName = 'order_binance';
                                            helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                    }else {  //for BTC
                                        let priceDifference = helperCon.getVolumeCheckingForusd(select_coin, created_Date, endTime, exchange);
                                        if(priceDifference != 0){

                                            let convertIntoBTC  = '';
                                            if(select_coin == 'BTCUSDT'){

                                                convertIntoBTC = priceDifference ;
                                            }else{

                                                let symbolPrice = await helperCon.getMarketPrice(select_coin , 'market_prices_binance')
                                                console.log('buy symbol Price ========>>>>>>>>>>>>>>>>>>>>>>>>>', symbolPrice.price);

                                                convertIntoBTC =  ( symbolPrice.price ) * priceDifference ;
                                            }

                                            if(convertIntoBTC < checking_value && convertIntoBTC != 0 ){

                                                if(quantity_behaviour == 'coins'){

                                                    let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                                                    let apiKey     =   userApiKeyDetails[0]['apiKey']
                                                    let secretKey  =   userApiKeyDetails[0]['secretKey']
                                                    
                                                    console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                                                    console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])
    
                                                    const binance = new Binance().options({
                                                        APIKEY      :   apiKey,
                                                        APISECRET   :   secretKey
                                                    });
                                
                                                    if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                                        
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
                                                }else if(quantity_behaviour == 'usd'){
                        
                                                    if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                        
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
                        
                                                }else if(quantity_behaviour == 'percentage'){
                                                    
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
                                            }else{
                                                let newObjectSet = {

                                                    checkingStartCount  :  (checkingStartCount -1)
                                                }
                                                if( (checkingStartCount - 1) <= 0 ){
                                                    
                                                    newObjectSet['expiredForChecking'] = true ;
                                                }

                                                let collectionName = 'order_binance';
                                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                            }
                                        }else{

                                            console.log('<<<<<<<<<<<<<<<=============   priceDifference is zero    ============>>>>>>>>>>>>>>>>>>>>')
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                        return true;
                                    }

                                }else if(has_checking == 'greater'){
                                    if(checking_symbol == 'percentage'){
                                        let volume = await helperCon.getVolumeCheckingForPercentage(select_coin, created_Date, endTime, exchange);
                                        console.log('volume=============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', volume);
                                        if(volume > checking_value){

                                            if(quantity_behaviour == 'coins'){
                                                if(use_wallet == 'BTCUSDT' || use_wallet == 'BUSDUSDT'){
                                                    
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
                                            }else if(quantity_behaviour == 'usd'){
                    
                                                if(buy_symbol == 'BTCUSDT' || buy_symbol == 'BUSDUSDT'){
                    
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
                    
                                            }else if(quantity_behaviour == 'percentage'){
                                                
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
                                        }else{

                                            console.log('not true !!!!!!!!!!')
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                    }else if(checking_symbol == 'usd'){
                                        //coin should be USDT pairs
                                        let priceDifference = helperCon.getVolumeCheckingForusd(select_coin, created_Date, endTime, 'binance');

                                        let convertIntoUSD  = '';
                                        if(select_coin == 'BUSDUSDT'){   //BUSDUSDT mean dollar price

                                            convertIntoUSD = priceDifference ;
                                        }else{

                                            let symbolPrice = await helperCon.getMarketPrice('BUSDUSDT' , 'market_prices_binance')
                                            console.log('buy symbol Price ========>>>>>>>>>>>>>>>>>>>>>>>>>', symbolPrice.price);
                                            convertIntoUSD = (symbolPrice.price > 0) ? ( (symbolPrice.price) *  priceDifference ) : 0 ;
                                        }
                                        console.log('convertIntoUSD =============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', convertIntoUSD);

                                        if(convertIntoUSD > checking_value){

                                            console.log('buy the order')
                                            return true ;
                                        }else{

                                            console.log('usd Price not true')
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                    }else {  //for BTC
                                        //coin pair should be BTC
                                        let priceDifference = helperCon.getVolumeCheckingForusd(select_coin, created_Date, endTime, exchange);
                                        if(priceDifference != 0){
                                            let convertIntoBTC  = '';
                                            if(select_coin == 'BTCUSDT'){

                                                convertIntoBTC = priceDifference ;
                                            }else{

                                                let symbolPrice = await helperCon.getMarketPrice('BTCUSDT' , 'market_prices_binance')
                                                console.log('buy symbol Price ========>>>>>>>>>>>>>>>>>>>>>>>>>', symbolPrice.price);
                                                convertIntoBTC =  ( symbolPrice.price ) * priceDifference ;
                                            }
                                            if(convertIntoBTC > checking_value){

                                                console.log('buy the coin')
                                                return true ;
                                            }else{

                                                console.log('BTC Price not True else')
                                            }
                                        }else{

                                            console.log('<<<<<<<<<<<<<<<=============   priceDifference is zero    ============>>>>>>>>>>>>>>>>>>>>')
                                        }
                                        //update the order count make expire if count 0 and add how much time this rule get true
                                        return true;
                                    }
                                }
                            }else if(has_condition == 'marketcap'){

                               
                            }else{
                                console.log(' Wrong condition')
                                return true;
                            }
                        }else{//end time check
                        
                            console.log('<<<<<<<<<<<<<<<<<<================  time type not valid  ===========>>>>>>>>>>>>>>>>>')
                        }
                    }//rnd loop
                }else{

                    console.log('Event Buy pending are not avaliable ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
                }
            }
        })
    },//end 
}