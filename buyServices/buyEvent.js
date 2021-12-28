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
                        // console.log('order id is : ====>>>>>>>>>>> ', order[orderIndex]['_id'] )
                        // console.log('order buy symbol : ====>>>>>>>>>>> ', order[orderIndex]['buy_symbol'] )
                        // console.log('order use wallet Symbol : ====>>>>>>>>>>> ', order[orderIndex]['use_wallet'] )
                        // console.log('order quantity : ====>>>>>>>>>>> ',order[orderIndex]['quantity'] )
                        // console.log('order behaviour : ====>>>>>>>>>>> ',order[orderIndex]['quantity_behaviour'] );
                        // console.log('user id : ====>>>>>>>>>>> ',order[orderIndex]['user_id'] );
                        if(order[orderIndex]['has_condiditon'] == 'volume'){
                            
                            if(order[orderIndex]['has_sorting_condition'] == 'increase'){
                                
                                if(order[orderIndex]['has_sorting'] == 'percentage'){
                                    let volume = helperCon.getVolumeCheckingForPercentage('BTCUSDT', 'start_time', 'end_time', 'binance');
                                    console.log('volume=============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', volume);
                                    if(volume >= 'inputPercentageValue'){

                                        return true;
                                    }else{
                                        return false;
                                    }
                                }else if(order[orderIndex]['has_sorting'] == 'usd'){

                                    let priceDifference = helperCon.getVolumeCheckingForusd('BTCUSDT', 'start_time', 'end_time', 'binance');

                                    let collection_name = 'market_prices_binance';
                                    let symbolPrice = await helper.getMarketPrice('BTCUSDT' , collection_name)
                                    console.log('buy symbol Price ========>>>>>>>>>>>>>>>>>>>>>>>>>', symbolPrice.price);

                                    let convertIntoUSD = (symbolPrice.price) *  priceDifference ;

                                    console.log('convertIntoUSD =============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', convertIntoUSD);

                                    if(convertIntoUSD >= 'inputPercentageValue'){

                                        return true ;
                                    }else{

                                        return false;
                                    }
                                }else {
                                     let priceDifference = helperCon.getVolumeCheckingForusd('BTCUSDT', 'start_time', 'end_time', 'binance');

                                    let convertIntoBTC  = '';
                                    if(symbol == 'BTCUSDT'){

                                        convertIntoBTC = priceDifference ;
                                    }else{

                                        let collection_name = 'market_prices_binance';
                                        let symbolPrice = await helper.getMarketPrice('BTCUSDT' , collection_name)
                                        console.log('buy symbol Price ========>>>>>>>>>>>>>>>>>>>>>>>>>', symbolPrice.price);

                                        convertIntoBTC =  ( symbolPrice.price ) * priceDifference ;
                                    }

                                    if(convertIntoBTC >= 'inputPercentageValue'){

                                        return true ;
                                    }else{

                                        return false;
                                    }
                                }
                            }else if(order[orderIndex]['has_sorting_condition'] == 'decrease'){
                            
                                if(order[orderIndex]['has_sorting'] == 'percentage'){
                                    let volume = helperCon.getVolumeCheckingForPercentage('BTCUSDT', 'start_time', 'end_time');
                                    if(volume <= 'inputPercentageValue'){

                                        return true;
                                    }else{
                                        return false;
                                    }
                                }else if(order[orderIndex]['has_sorting'] == 'usd'){

                                    let volumeInusd = helperCon.getVolumeCheckingForusd('BTCUSDT', 'start_time', 'end_time');
                                    if(volumeInusd <= 'inputPercentageValue'){

                                        return true ;
                                    }else{

                                        return false;
                                    }
                                }else {

                                    let volumeInBtc = helperCon.getVolumeCheckingForBTC('BTCUSDT', 'start_time', 'end_time');
                                    if(volumeInBtc <= 'inputPercentageValue'){

                                        return true ;
                                    }else{

                                        return false;
                                    }
                                }
                            }else if(order[orderIndex]['has_sorting_condition'] == 'lower'){
                                //from order_created_Time to  next time checking  >  volume


                                if(order[orderIndex]['has_sorting'] == 'percentage'){

                                }else if(order[orderIndex]['has_sorting'] == 'usd'){

                                }else {

                                    //btc
                                }


                            }else if(order[orderIndex]['has_sorting_condition'] == 'greater'){
                                //from order_created_Time to  next time checking  <=  volume


                                if(order[orderIndex]['has_sorting'] == 'percentage'){

                                }else if(order[orderIndex]['has_sorting'] == 'usd'){

                                }else {

                                    //btc
                                }

                            }

                        }else if(order[orderIndex]['has_condiditon'] == 'price'){

                            if(order[orderIndex]['has_sorting'] == 'increase'){


                                if(order[orderIndex]['has_sorting'] == 'percentage'){

                                }else if(order[orderIndex]['has_sorting'] == 'usd'){

                                }else {

                                    //btc
                                }




                            }else if(order[orderIndex]['has_sorting'] == 'decrease'){


                                if(order[orderIndex]['has_sorting'] == 'percentage'){

                                }else if(order[orderIndex]['has_sorting'] == 'usd'){

                                }else {

                                    //btc
                                }



                            }else if(order[orderIndex]['has_sorting'] == 'lower'){


                                if(order[orderIndex]['has_sorting'] == 'percentage'){

                                }else if(order[orderIndex]['has_sorting'] == 'usd'){

                                }else {

                                    //btc
                                }



                            }else if(order[orderIndex]['has_sorting'] == 'greater'){


                                if(order[orderIndex]['has_sorting'] == 'percentage'){

                                }else if(order[orderIndex]['has_sorting'] == 'usd'){

                                }else {

                                    //btc
                                }

                            }


                        }else if(order[orderIndex]['has_condiditon'] == 'marketcap'){


                            if(order[orderIndex]['has_sorting'] == 'increase'){



                                if(order[orderIndex]['has_sorting'] == 'percentage'){

                                }else if(order[orderIndex]['has_sorting'] == 'usd'){

                                }else {

                                    //btc
                                }



                            }else if(order[orderIndex]['has_sorting'] == 'decrease'){


                                if(order[orderIndex]['has_sorting'] == 'percentage'){

                                }else if(order[orderIndex]['has_sorting'] == 'usd'){

                                }else {

                                    //btc
                                }



                            }else if(order[orderIndex]['has_sorting'] == 'lower'){


                                if(order[orderIndex]['has_sorting'] == 'percentage'){

                                }else if(order[orderIndex]['has_sorting'] == 'usd'){

                                }else {

                                    //btc
                                }


                            }else if(order[orderIndex]['has_sorting'] == 'greater'){


                                if(order[orderIndex]['has_sorting'] == 'percentage'){

                                }else if(order[orderIndex]['has_sorting'] == 'usd'){

                                }else {

                                    //btc
                                }

                            }
                        }else{
                            console.log(' Wrong condition')
                            return true;
                        }
                    }//rnd loop
                }else{

                    console.log('Event Buy pending are not avaliable ==============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
                }
            }
        })
    },//end 
}