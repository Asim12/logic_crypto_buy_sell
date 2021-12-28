const conn = require('../DataBase/connection');
const MongoClient =   require('mongodb').MongoClient;
const objectId    =   require('mongodb').ObjectId;
const { IoTJobsDataPlane } = require("aws-sdk");

module.exports = { 

    getDirectBuyOrders : () => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let order = await db.collection('order_binance').find({type : "direct", status : "new", exchange : "binance", action : "buy"}, {projection : {buy_symbol : "$buy_symbol", use_wallet : "$use_wallet", quantity : "$quantity", quantity_behaviour : "$quantity_behaviour", user_id : "$user_id"  }}).limit(5).toArray()
                resolve(order)  
            })
        })
    },//end helper

    getEventBuyOrders : () => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let currentTime = new Date();
                let order = await db.collection('order_binance').find({ execuation_time : { execuation_count : { '$gte' : 0 }, '$gte' : currentTime }  , status : "new", exchange : "binance", action : "buy", type : "event"}, {projection : {buy_symbol : "$buy_symbol", use_wallet : "$use_wallet", quantity : "$quantity", quantity_behaviour : "$quantity_behaviour", user_id : "$user_id"  }}).limit(5).toArray()
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
                console.log('dataNew =====>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' , data)

                let SearchObjectNext = {
                    symbol  : symbol,
                    time    : {'$gte' : endTime } 
                }
                let dataNew = await db.collection(collectionName).find(SearchObjectNext).sort({time : 1}).limit(1).toArray()
                console.log('dataNew =====>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',  dataNew)

                let volumeStart = data[0]['volume']
                let volumeEnd   = dataNew[0]['volume']

                let volume = ( volumeStart / volumeEnd ) * 100 ; // volume in percentage 
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
                console.log('dataNew =====>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' , data)

                let SearchObjectNext = {
                    symbol  : symbol,
                    time    : {'$gte' : endTime } 
                }
                let dataNew = await db.collection(collectionName).find(SearchObjectNext).sort({created_date : 1}).limit(1).toArray()
                console.log('dataNew =====>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',  dataNew)

                let startPrice =  data[0]['price'] ;
                let endPrice   =  dataNew[0]['price'] ;
                let CheckPrice  =   endPrice  - startPrice ;
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

}