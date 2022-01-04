const conn = require('../DataBase/connection');
const MongoClient =   require('mongodb').MongoClient;
const objectId    =   require('mongodb').ObjectId;
const { IoTJobsDataPlane } = require("aws-sdk");
const Binance = require('node-binance-api');


module.exports = { 

    getDirectBuyOrders : () => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let order = await db.collection('order_binance').find({type : "direct", status : "new", exchange : "binance", action : "buy"}, {projection : {buy_symbol : "$buy_symbol", use_wallet : "$use_wallet", quantity : "$quantity", quantity_behaviour : "$quantity_behaviour", user_id : "$user_id"  }}).limit(1).toArray()
                resolve(order)  
            })
        })
    },//end helper

    getEventBuyOrders : () => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let order = await db.collection('order_binance').find({ expiredForChecking : {'$exists' : false} , startTime : {'$lte' : new Date()}, checkingStartCount : {'$gt' : 0}, status : { "$in" : ["active" ,"new"] }, exchange : "binance", action : "buy", type : "event"}).limit(5).toArray()
                resolve(order)  
            })
        })
    },//end helper

    getTimerBuyOrders : () => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let order = await db.collection('order_binance').find({ timeCondition : "every",startTime : {'$lte' : new Date()}, status : {'$in' : ["new", "active"]},action : "buy", type: "timer", checkingStartCount : {'$gt' : 0}, expiredForChecking: {'$exists': false }   }).limit(5).toArray()
                resolve(order)  
            })
        })
    },//end helper


    getTimerSellOrders : () => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let order = await db.collection('order_binance').find({ timeCondition : "every",startTime : {'$lte' : new Date()}, status : {'$in' : ["new", "active"]},action : "sell", type: "timer", checkingStartCount : {'$gt' : 0}, expiredForChecking: {'$exists': false }   }).limit(5).toArray()
                resolve(order)  
            })
        })
    },//end helper

    getTimerOnBuyOrders : () => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let order = await db.collection('order_binance').find({ startTime : {'$lte' : new Date()}, status : "new", action : "buy", timeCondition : "on", type: "timer", checkingStartCount : {'$gt' : 0}, expiredForChecking: {'$exists': false }   }).limit(5).toArray()
                resolve(order)  
            })
        })
    },//end helper

    getTimerOnSellOrders : () => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let order = await db.collection('order_binance').find({ startTime : {'$lte' : new Date()}, status : "new", action : "sell", timeCondition : "on", type: "timer", checkingStartCount : {'$gt' : 0}, expiredForChecking: {'$exists': false }   }).limit(5).toArray()
                resolve(order)  
            })
        })
    },//end helper


    getTimerRightNowBuyOrders : () => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let order = await db.collection('order_binance').find({ status : {'$in' : ["new", "active"]},action : "buy",timeCondition : "right_now", type: "timer", checkingStartCount : {'$gt' : 0}, expiredForChecking: {'$exists': false }   }).limit(5).toArray()
                resolve(order)  
            })
        })
    },//end helper


    getTimerRightNowSellOrders : () => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let order = await db.collection('order_binance').find({ status : {'$in' : ["new", "active"]},action : "sell",timeCondition : "right_now", type: "timer", checkingStartCount : {'$gt' : 0}, expiredForChecking: {'$exists': false }   }).limit(5).toArray()
                resolve(order)  
            })
        })
    },//end helper
    

    getDirectSellOrders : () => {
        return new Promise(resolve => {
            conn.then(async(db) => {
          
                let order = await db.collection('order_binance').find({status : "new", exchange : "binance", action : "sell"}, {projection : {buy_symbol : "$buy_symbol", use_wallet : "$use_wallet", quantity : "$quantity", quantity_behaviour : "$quantity_behaviour", user_id : "$user_id"  }}).limit(5).toArray()
                resolve(order)  
            })
        })
    },

    getUserApiKeyDetails : (userId, exchange) => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let getExchangeDetails = [
                    {
                        '$match' : {
                            
                            'exchange' : exchange,
                            user_id : userId.toString()
                        }
                    },
                    {
                        '$project' : {
                            _id         :  {'$toString' : '$_id'},
                            user_id     :  "$user_id",
                            apiKey      :  "$apiKey",
                            secretKey   :  "$secretKey"
                        }
                    },
                ];

                let data = await db.collection('exchanges').aggregate(getExchangeDetails).toArray();
                resolve(data);
            })
        })
    },//end helper

    getBalancePercentage : (user_id, buy_symbol, value)=> {
        return new Promise( resolve => {
            conn.then(async(db) => {
                
                var symbolEnd  = buy_symbol.substr(buy_symbol.length - 3); 
                console.log('buy_symbol ===================>>>>>>>>>>>>>>>>>', symbolEnd);
                if(symbolEnd == 'BTC'){

                }else{
                    // var symbolEnd  = buy_symbol.substr(buy_symbol.length - 4); 
                }
                let calculatePercenatge = [
                    {
                        '$match' : {
                            userId : new objectId(user_id.toString()),
                            symbol : buy_symbol
                        }
                    },
                    {
                        '$project' : {
                            _id      :    { '$toString' : '$_id' },

                            'percentage' : {
                                '$cond' : {
                                    'if' : { '$eq' : ['$balance', 0]},
                                    'then' : 0,
                                    'else' : {'$multiply': [ {'$divide' : [ value ,  '$balance' ] }, 100 ]} 
                                }
                            },
                        }
                    },

                ];
                let result = await db.collection('balance_binance').aggregate(calculatePercenatge).toArray();
                resolve(result)
            })
        })
    },//end 

    updateOrder : (order_id,  newObjectSet, collectionName) => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                db.collection(collectionName).updateOne({_id : new objectId(order_id) }, {'$set' : newObjectSet }, async(error, result) => {
                    if(error){

                        console.log('DataBase have some issue!!!!!!')
                        resolve(false)
                    }else{

                        console.log('Order is updated!!!!!!!!!!')
                        resolve(true);
                    }
                })
            })
        })
    },//end

    checkPrices : (collectionName) => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let currentTime = new Date()
                var olderDate   = new Date(currentTime);
                olderDate.setMinutes(olderDate.getMinutes() - 2)

                let collectionNames = 'market_prices_'+ collectionName;
                console.log('collectionName ===>>>>>>>>>>>>>>>>>>>>>>', collectionNames);

                let count = await db.collection(collectionNames).countDocuments({ created_date : {'$lte' : olderDate }  });
                resolve(count)
            })
        })
    },//end 

    checkTradingIsOn : (collectionName) => {
        return new Promise(resolve => {
            conn.then(async(db) => {

                let count = db.collection(collectionName).countDocuments({ buy: false, sell : false });
                resolve(count);
            })
        })
    },//end

    getMarketPrice : (symbol, collectionName) => {
        return new Promise(resolve => {
            conn.then(async(db) => {

                db.collection(collectionName).findOne({ symbol : symbol}, async(err, result) => {
                    if(err){

                        console.log('DataBase have some issue!!!!');
                        resolve(false);
                    }else{

                        let price = await result
                        resolve(price);
                    }
                })
            })
        })
    },//end 

    getVolumeCheckingForPercentage : (symbol, startTime, endTime, exchangeName) => {
        return new Promise(resolve => {
            conn.then(async(db) => {

                let collectionName = 'market_chart_'+exchangeName;
                console.log('collection name is =====>>>>>>>>>>>>>>>>>', collectionName )
                
                let SearchObject = {
                    symbol  : symbol,
                    time    : {'$lte' : startTime } 
                }
                let data = await db.collection(collectionName).find(SearchObject).sort({time : -1}).limit(1).toArray()

                let SearchObjectNext = {
                    symbol  : symbol,
                    time    : {'$gte' : endTime } 
                }
                let dataNew = await db.collection(collectionName).find(SearchObjectNext).sort({time : 1}).limit(1).toArray()

                let volumeStart = (data.length > 0) ? (data[0]['volume']) : 0;
                let volumeEnd   = (dataNew.length > 0) ? (dataNew[0]['volume']) : 0;

                let volume = ( volumeStart.length > 0 && volumeEnd.length > 0) ? ( (volumeStart / volumeEnd ) * 100) : 0;
                resolve(volume)
            })
        })
    },

    getVolumeCheckingForusd : (symbol, startTime, endTime, exchangeName) => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let collectionName = 'market_prices_history_'+exchangeName;
                console.log('collectionName =====>>>>>>>>>>>>>>>>>>>>>>>>>>> ', collectionName )

                let SearchObject = {
                    symbol  : symbol,
                    time    : {'$lte' : startTime } 
                }
                let data = await db.collection(collectionName).find(SearchObject).sort({created_date : -1}).limit(1).toArray()

                let SearchObjectNext = {
                    symbol  : symbol,
                    time    : {'$gte' : endTime } 
                }
                let dataNew = await db.collection(collectionName).find(SearchObjectNext).sort({created_date : 1}).limit(1).toArray()

                let startPrice =  (data.length > 0 ) ? data[0]['price'] : 0 ;
                let endPrice   =  (dataNew.length > 0 ) ? dataNew[0]['price'] : 0 ;

                let CheckPrice  =   ( startPrice > 0 && endPrice > 0 ) ? ( endPrice  - startPrice ) : 0 ;
                resolve(CheckPrice)
            })
        })
    },

    getPriceCheckingForusdInCoinMarketCap : (symbol, startTime, endTime, exchangeName) => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                
                let symbolNew = symbol.split("BTC");
                
                if(symbolNew.length <= 1){
                    
                    symbolNew = symbol.split("USDT");
                }

                let SearchObject = {
                    symbol  : symbolNew,
                    created_date    : {'$lte' : startTime } 
                }
                let data = await db.collection('market_prices_coin_market_cap').find(SearchObject).sort({created_date : -1}).limit(1).toArray()

                let SearchObjectNext = {
                    symbol  : symbolNew,
                    created_date    : {'$gte' : endTime } 
                }
                let dataNew = await db.collection('market_prices_coin_market_cap').find(SearchObjectNext).sort({created_date : 1}).limit(1).toArray()

                let startPrice =  (data.length > 0 ) ? data[0]['price'] : 0 ;
                let endPrice   =  (dataNew.length > 0 ) ? dataNew[0]['price'] : 0 ;

                let CheckPrice  =   ( startPrice > 0 && endPrice > 0 ) ? ( endPrice  - startPrice ) : 0 ;
                resolve(CheckPrice)
            })
        })
    },


    getVolumeCheckingForBTC : (symbol, startTime, endTime, exchangeName) => {
        return new Promise(resolve => {
            conn.then(async(db) => {

            })
        })
    },

    makeTheEndTime : (time , convertionType, value) => {
        return new Promise(resolve => {

            let created_date  =  new Date( time );
            if(convertionType == 'm'){

                var endTime1 = created_date.setMinutes(created_date.getMinutes() + value );
                let endTime  = new Date(endTime1);
                resolve(endTime);
            }else if(convertionType == 'h'){

                var endTime1 = created_date.setHours(created_date.getHours() + value)
                let endTime = new Date(endTime1);
                resolve(endTime);
            }else if(convertionType == 'd'){

                var endTime1 = created_date.setDate(created_date.getDate() + value);
                let endTime  = new Date(endTime1);
                resolve(endTime);
            }else if(convertionType == 'w'){ //week
                
                var endTime1 = created_date.setDate(created_date.getDate() + (value * 7))
                let endTime = new Date(endTime1);
                resolve(endTime);
            }else{
                resolve(false);
            }
        })
    },


    getCoinMarketCapVolumeCheckingForPercentage : (symbol, startTime, endTime, exchangeName) => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                
                let symbolNew = symbol.split("BTC");
                
                if(symbolNew.length <= 1){
                    
                    symbolNew = symbol.split("USDT");
                }
                let SearchObject = {
                    symbol          :   symbolNew,
                    created_date    :   {'$lte' : startTime } 
                }
                let data = await db.collection('market_prices_coin_market_cap').find(SearchObject).sort({created_date : -1}).limit(1).toArray()

                let SearchObjectNext = {
                    symbol          :   symbol,
                    created_date    :   {'$gte' : endTime } 
                }
                let dataNew = await db.collection('market_prices_coin_market_cap').find(SearchObjectNext).sort({created_date : 1}).limit(1).toArray()

                let volumeStart = (data.length > 0) ? (data[0]['volume_24h']) : 0;
                let volumeEnd   = (dataNew.length > 0) ? (dataNew[0]['volume_24h']) : 0;

                let volume = ( volumeStart.length > 0 && volumeEnd.length > 0) ? ( (volumeStart / volumeEnd ) * 100) : 0;
                resolve(volume)
            })
        })
    },

    //balance update call
    balanceUpdate : (user_id) => {
        return new Promise(resolve => {
            conn.then(async (db) => { 

                let exchangeDetails = await db.collection('exchanges').find({user_id : user_id.toString(),  exchange : "binance"}).toArray()

                let lookup = [
                    {
                        '$group' : {
                            _id       : '$symbol',  
                            coin_name : {'$first' : '$coin_name'}
                        }
                    }
                ]
                let coins = await db.collection('coins_binance').aggregate(lookup).toArray()
    
                if(exchangeDetails.length > 0){
                    const binance = new Binance().options({
                        APIKEY      :   exchangeDetails[0]['apiKey'],
                        APISECRET   :   exchangeDetails[0]['secretKey']
                    });

                    binance.balance(async (error, balances) => {
                        if ( error ){

                            db.collection('exchanges').updateOne({ user_id : exchangeDetails[0]['user_id']}, {'$set' : { updated_time : new Date()}})
                            console.log('error')
                            resolve(false);
                        }else{
                            for( let coinIteration = 0 ; coinIteration < coins.length ;  coinIteration++ ){
                                let coinName = coins[coinIteration]['coin_name'];
                                
                                let insertBalance = {
                                    balance  :  (balances[coinName].available > 0) ? parseFloat(balances[coinName].available) : parseFloat(0)  ,
                                    onOrder  :  (balances[coinName].onOrder > 0) ? parseFloat(balances[coinName].onOrder) : parseFloat(0) ,
                                    create_date : new Date()
                                } 
                                db.collection('balance_binance').updateOne({symbol : coins[coinIteration]['_id'], user_id :  exchangeDetails[0]['user_id']}, {'$set' : insertBalance}, {upsert:true})
                            }//end loop
                            db.collection('exchanges').updateOne({ user_id : exchangeDetails[0]['user_id']}, {'$set' : { updated_time : new Date()}})
                            console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<============ Blance call is running ===========>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
                            resolve(true)
                        }//end else
                    });
                }
            })
        })
    },//end balance 


    buyBinaneCall : (symbol, quantity, apiKey, secretKey) => {
        return new Promise(async(resolve) => {
        
            const binance = new Binance().options({
                APIKEY      :   apiKey,
                APISECRET   :   secretKey
            });
            let response = await binance.marketBuy(symbol, quantity)
            resolve(response)
        })
    },
   

    selBinanceCall : (symbol, quantity, apiKey, secretKey) => {
        return new Promise(async(resolve) => {
            const binance = new Binance().options({
                APIKEY      :   apiKey,
                APISECRET   :   secretKey
            });
            let response = await binance.marketSell(symbol, quantity)
            resolve(response)

        })
    },


    saveOrderLog : (order_id, collection_name, message) => {
        return new Promise(resolve => {
            conn.then(async(db) => {

                let insertObject = {

                    order_id        :   order_id,
                    created_date    :   new Date(),
                    message         :   message
                }
                db.collection(collection_name).insertOne(insertObject);
                resolve(true)
            })
        })
    }
}