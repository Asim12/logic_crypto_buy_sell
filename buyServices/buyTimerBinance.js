const Binance = require('node-binance-api');
const conn = require('../DataBase/connection');
var helperCon = require("../helpers/helper");

module.exports = {
    timersBuyEvery : () => {
        conn.then(async (db) => { 
            let checkStatus = await helperCon.checkTradingIsOn('binance_trading_status');
            if(checkStatus > 0){

                console.log('trading is Off you cannot buy or sell anything');
            }else{
                let order = await helperCon.getTimerBuyOrders();
                console.log('timer order length ==============================>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', order.length);
                if(order.length > 0){
                    for(let orderIndex = 0 ; orderIndex < order.length ;  orderIndex++){
                
                        // console.log('order id is : ====>>>>>>>>>>> ', order[orderIndex]['_id'] );
                        // console.log('checkingStartCount : ====>>>>>>>>>>> ', order[orderIndex]['checkingStartCount'] ) //count ha kitne dafa check kr k expire krna ha
                        // console.log('quantity : ====>>>>>>>>>>> ', order[orderIndex]['quantity'] )
                        // console.log('quantity_behaviour : ====>>>>>>>>>>> ', order[orderIndex]['quantity_behaviour'] )
                        // console.log('order buy symbol : ====>>>>>>>>>>> ', order[orderIndex]['buy_symbol'] )
                        // console.log('order use wallet Symbol : ====>>>>>>>>>>> ', order[orderIndex]['use_wallet'] )
                        // console.log('exchange : ====>>>>>>>>>>> ', order[orderIndex]['exchange'] )
                        // console.log('user id : ====>>>>>>>>>>> ', order[orderIndex]['user_id'] );
                        // console.log('time Condition : ====>>>>>>>>>>> ', order[orderIndex]['timeCondition'] );
                        // console.log('startTimeType : ====>>>>>>>>>>> ', order[orderIndex]['startTimeType'] ); // price , volume , marketCap
                        // console.log('checking_time : ====>>>>>>>>>>> ', order[orderIndex]['checking_time'] ) // kitne mints bad check krna ha 
                        // console.log('execuationCondition : ====>>>>>>>>>>> ', order[orderIndex]['execuationCondition'] ) 
                        // console.log('checkingTimeRange : ====>>>>>>>>>>> ', order[orderIndex]['checkingTimeRange'] )
                        // console.log('checkingTimeRangeType : ====>>>>>>>>>>> ', order[orderIndex]['checkingTimeRangeType'] );

                        let order_id            =   order[orderIndex]['_id'] ;
                        let checkingStartCount  =   order[orderIndex]['checkingStartCount'] ;
                        let quantity            =   order[orderIndex]['quantity'] ;
                        let quantity_behaviour  =   order[orderIndex]['quantity_behaviour'] ;
                        let buy_symbol          =   order[orderIndex]['buy_symbol'] ; 
                        let use_wallet          =   order[orderIndex]['use_wallet'] ;
                        // let exchange            =   order[orderIndex]['exchange'] ;
                        let user_id             =   order[orderIndex]['user_id'] ;
                        let timeCondition       =   order[orderIndex]['timeCondition'] ;
                        let created_date_new    =   order[orderIndex]['created_date_new'] ;

                       
                        let execuationCondition =   order[orderIndex]['execuationCondition'] ;
                        // let checkingTimeRange   =   order[orderIndex]['checkingTimeRange'] ;
                        // let checkingTimeRangeType   =   order[orderIndex]['checkingTimeRangeType'] ;

                        let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                        let apiKey     =   userApiKeyDetails[0]['apiKey']
                        let secretKey  =   userApiKeyDetails[0]['secretKey']
                        
                        console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                        console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])

                        const binance = new Binance().options({
                            APIKEY      :   apiKey,
                            APISECRET   :   secretKey
                        });

                        if(timeCondition == 'every'){
                            
                            let startTime           =   order[orderIndex]['startTime'] ;
                            let startTimeType       =   order[orderIndex]['startTimeType'] ;
                            let checking_time       =   order[orderIndex]['checking_time'] ;
                            let endTime = await helperCon.makeTheEndTime(startTime,  startTimeType,  checking_time ) ;
                            
                            if(execuationCondition == 'but_not_more_than'){
                                
                                let checkingTimeRange      =  order[orderIndex]['checkingTimeRange'] 
                                let checkingTimeRangeType  =  order[orderIndex]['checkingTimeRangeType'] 
                                let endTimeForOrderValidation = await helperCon.makeTheEndTime(created_date_new,  checkingTimeRangeType,  checkingTimeRange ) ;

                                if(endTimeForOrderValidation <= new Date() ) {

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
                                            checkingStartCount  :  (checkingStartCount -1),
                                            purchased_price_buy_symbol : '',
                                            startTime           :  endTime,
                                            created_date        :  new Date(),
                                            status              :  'active'
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
                                            checkingStartCount  :  (checkingStartCount -1),
                                            purchased_price_buy_symbol : '',
                                            startTime           :  endTime,
                                            created_date        :  new Date(),
                                            status              :  'active'
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
                                            checkingStartCount  :  (checkingStartCount -1),
                                            purchased_price_buy_symbol : '',
                                            startTime           :  endTime,
                                            created_date        :  new Date(),
                                            status              :  'active'
                                        }
                                        if( (checkingStartCount - 1) <= 0 ){
                                            
                                            newObjectSet['expiredForChecking'] = true ;
                                        }
                                        let collectionName = 'order_binance';
                                        helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                    }
                                }else{
                                    let newObjectSet = {
                                        checkingStartCount  :  0,
                                        startTime           :  new Date(),
                                        created_date        :  new Date(),
                                        status              :  'expired',
                                        expiredForChecking  :  true ,

                                    }
                                    if( (checkingStartCount - 1) <= 0 ){
                                        
                                        newObjectSet['expiredForChecking'] = true ;
                                    }
                                    let collectionName = 'order_binance';
                                    helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                }
                            }//done checked
                            else if(execuationCondition == 'in_total'){
                                if(order[orderIndex]['quantity_behaviour'] == 'coins'){
                                
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
                                        checkingStartCount  :  (checkingStartCount -1),
                                        purchased_price_buy_symbol : '',
                                        startTime           :  endTime,
                                        created_date        :  new Date(),
                                        status              :  'active'
                                    }
                                    if( (checkingStartCount - 1) <= 0 ){
                                        
                                        newObjectSet['expiredForChecking'] = true ;
                                    }
                                    let collectionName = 'order_binance';
                                    helperCon.updateOrder(order_id,  newObjectSet, collectionName)

                                }else if(order[orderIndex]['quantity_behaviour'] == 'usd'){
        
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
                                        checkingStartCount  :  (checkingStartCount -1),
                                        purchased_price_buy_symbol : '',
                                        startTime           :  endTime,
                                        created_date        :  new Date(),
                                        status              :  'active'
                                    }
                                    if( (checkingStartCount - 1) <= 0 ){
                                        
                                        newObjectSet['expiredForChecking'] = true ;
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
                                        checkingStartCount  :  (checkingStartCount -1),
                                        purchased_price_buy_symbol : '',
                                        startTime           :  endTime,
                                        created_date        :  new Date(),
                                        status              :  'active'
                                    }
                                    if( (checkingStartCount - 1) <= 0 ){
                                        
                                        newObjectSet['expiredForChecking'] = true ;
                                    }
                                    let collectionName = 'order_binance';
                                    helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                }
                            }//done checked
                        }                  
                    }
                }else{

                    console.log('Timer Buy pending are not avaliable ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
                }
            }
        })
    },

    timersBuyOn : () => {
        conn.then(async (db) => { 
            let checkStatus = await helperCon.checkTradingIsOn('binance_trading_status');
            if(checkStatus > 0){

                console.log('trading is Off you cannot buy or sell anything');
            }else{
                let order = await helperCon.getTimerOnBuyOrders();
                console.log('timer on order length ==============================>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', order.length);
                if(order.length > 0){
                    for(let orderIndex = 0 ; orderIndex < order.length ;  orderIndex++){

                        let order_id            =   order[orderIndex]['_id'] ;
                        let checkingStartCount  =   order[orderIndex]['checkingStartCount'] ;
                        let quantity            =   order[orderIndex]['quantity'] ;
                        let quantity_behaviour  =   order[orderIndex]['quantity_behaviour'] ;
                        let buy_symbol          =   order[orderIndex]['buy_symbol'] ; 
                        let use_wallet          =   order[orderIndex]['use_wallet'] ;
                        let exchange            =   order[orderIndex]['exchange'] ;
                        let user_id             =   order[orderIndex]['user_id'] ;
                        let timeCondition       =   order[orderIndex]['timeCondition'] ;
                        let created_date_new    =   order[orderIndex]['created_date_new'] ;

                       
                        let execuationCondition =   order[orderIndex]['execuationCondition'] ;
                        let checkingTimeRange   =   order[orderIndex]['checkingTimeRange'] ;
                        let checkingTimeRangeType   =   order[orderIndex]['checkingTimeRangeType'] ;

                        let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                        let apiKey     =   userApiKeyDetails[0]['apiKey']
                        let secretKey  =   userApiKeyDetails[0]['secretKey']
                        
                        console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                        console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])

                        const binance = new Binance().options({
                            APIKEY      :   apiKey,
                            APISECRET   :   secretKey
                        });


                        if(timeCondition == 'on'){

                            if(order[orderIndex]['quantity_behaviour'] == 'coins'){
                                
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
                                    checkingStartCount  :  0,
                                    purchased_price_buy_symbol : '',
                                    // startTime           :  endTime,
                                    created_date        :  new Date(),
                                    status              :  'active',
                                    'expiredForChecking':  true
                                }
                               
                                let collectionName = 'order_binance';
                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)

                            }else if(order[orderIndex]['quantity_behaviour'] == 'usd'){
    
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
                                    checkingStartCount  :  0,
                                    purchased_price_buy_symbol : '',
                                    startTime           :  endTime,
                                    created_date        :  new Date(),
                                    status              :  'active',
                                    'expiredForChecking':  true
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
                                    checkingStartCount  :  0,
                                    purchased_price_buy_symbol : '',
                                    startTime           :  endTime,
                                    created_date        :  new Date(),
                                    status              :  'active',
                                    'expiredForChecking':  true
                                }
                               
                                let collectionName = 'order_binance';
                                helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                            }
                        }
                    }
                }else{

                    console.log('Timer Buy ON pending are not avaliable ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
                }
            }
        })
    },



    timersBuyRightNow : () => {
        conn.then(async (db) => { 
            let checkStatus = await helperCon.checkTradingIsOn('binance_trading_status');
            if(checkStatus > 0){

                console.log('trading is Off you cannot buy or sell anything');
            }else{
                let order = await helperCon.getTimerRightNowBuyOrders();
                console.log('timer right now order length ==============================>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', order.length);
                if(order.length > 0){
                    for(let orderIndex = 0 ; orderIndex < order.length ;  orderIndex++){

                        let order_id            =   order[orderIndex]['_id'] ;
                        let checkingStartCount  =   order[orderIndex]['checkingStartCount'] ;
                        let quantity            =   order[orderIndex]['quantity'] ;
                        let quantity_behaviour  =   order[orderIndex]['quantity_behaviour'] ;
                        let buy_symbol          =   order[orderIndex]['buy_symbol'] ; 
                        let use_wallet          =   order[orderIndex]['use_wallet'] ;
                        // let exchange            =   order[orderIndex]['exchange'] ;
                        let user_id             =   order[orderIndex]['user_id'] ;
                        let timeCondition       =   order[orderIndex]['timeCondition'] ;
                        let created_date_new    =   order[orderIndex]['created_date_new'] ;

                        let execuationCondition =   order[orderIndex]['execuationCondition'] ;
                        // let checkingTimeRange   =   order[orderIndex]['checkingTimeRange'] ;
                        // let checkingTimeRangeType   =   order[orderIndex]['checkingTimeRangeType'] ;

                        let userApiKeyDetails =  await helperCon.getUserApiKeyDetails(user_id, 'binance')
                        let apiKey     =   userApiKeyDetails[0]['apiKey']
                        let secretKey  =   userApiKeyDetails[0]['secretKey']
                        
                        console.log('api Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['apiKey'])
                        console.log('secret Key ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', userApiKeyDetails[0]['secretKey'])

                        const binance = new Binance().options({
                            APIKEY      :   apiKey,
                            APISECRET   :   secretKey
                        });

                        if(timeCondition == 'right_now'){

                            if(execuationCondition == 'but_not_more_than'){
                                
                                let checkingTimeRange      =  order[orderIndex]['checkingTimeRange'] 
                                let checkingTimeRangeType  =  order[orderIndex]['checkingTimeRangeType'] 
                                let endTimeForOrderValidation = await helperCon.makeTheEndTime(created_date_new,  checkingTimeRangeType,  checkingTimeRange ) ;

                                if(endTimeForOrderValidation <= new Date() ) {

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
                                            checkingStartCount  :  (checkingStartCount -1),
                                            purchased_price_buy_symbol : '',
                                            startTime           :  endTime,
                                            created_date        :  new Date(),
                                            status              :  'active'
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
                                            checkingStartCount  :  (checkingStartCount -1),
                                            purchased_price_buy_symbol : '',
                                            startTime           :  endTime,
                                            created_date        :  new Date(),
                                            status              :  'active'
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
                                            checkingStartCount  :  (checkingStartCount -1),
                                            purchased_price_buy_symbol : '',
                                            startTime           :  endTime,
                                            created_date        :  new Date(),
                                            status              :  'active'
                                        }
                                        if( (checkingStartCount - 1) <= 0 ){
                                            
                                            newObjectSet['expiredForChecking'] = true ;
                                        }
                                        let collectionName = 'order_binance';
                                        helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                    }
                                }else{
                                    let newObjectSet = {
                                        checkingStartCount  :  0,
                                        startTime           :  new Date(),
                                        created_date        :  new Date(),
                                        status              :  'expired',
                                        expiredForChecking  :  true ,

                                    }
                                    if( (checkingStartCount - 1) <= 0 ){
                                        
                                        newObjectSet['expiredForChecking'] = true ;
                                    }
                                    let collectionName = 'order_binance';
                                    helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                }
                            }//done checked
                            else if(execuationCondition == 'in_total'){
                                if(order[orderIndex]['quantity_behaviour'] == 'coins'){
                                
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
                                        checkingStartCount  :  (checkingStartCount -1),
                                        purchased_price_buy_symbol : '',
                                        startTime           :  endTime,
                                        created_date        :  new Date(),
                                        status              :  'active'
                                    }
                                    if( (checkingStartCount - 1) <= 0 ){
                                        
                                        newObjectSet['expiredForChecking'] = true ;
                                    }
                                    let collectionName = 'order_binance';
                                    helperCon.updateOrder(order_id,  newObjectSet, collectionName)

                                }else if(order[orderIndex]['quantity_behaviour'] == 'usd'){
        
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
                                        checkingStartCount  :  (checkingStartCount -1),
                                        purchased_price_buy_symbol : '',
                                        startTime           :  endTime,
                                        created_date        :  new Date(),
                                        status              :  'active'
                                    }
                                    if( (checkingStartCount - 1) <= 0 ){
                                        
                                        newObjectSet['expiredForChecking'] = true ;
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
                                        checkingStartCount  :  (checkingStartCount -1),
                                        purchased_price_buy_symbol : '',
                                        startTime           :  endTime,
                                        created_date        :  new Date(),
                                        status              :  'active'
                                    }
                                    if( (checkingStartCount - 1) <= 0 ){
                                        
                                        newObjectSet['expiredForChecking'] = true ;
                                    }
                                    let collectionName = 'order_binance';
                                    helperCon.updateOrder(order_id,  newObjectSet, collectionName)
                                }
                            }//done checked
                        }
                    }
                }else{

                    console.log('Timer Buy right_now pending are not avaliable ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
                }
            }
        })
    },
}//end 